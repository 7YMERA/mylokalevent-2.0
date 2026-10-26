-- Categories, events and event images (task 3.1).
-- Every table has RLS. Event status changes (approve/reject/unpublish) go
-- through an admin-only security-definer function that writes the audit log,
-- the same pattern as set_user_status and set_organiser_verification.

-- PostGIS gives us a point for each venue, used by the map view (task 3.4).
create extension if not exists postgis with schema extensions;

-- Event lifecycle. draft -> awaiting_payment -> in_review -> approved/rejected;
-- an approved event can later be unpublished.
create type public.event_status as enum (
  'draft',
  'awaiting_payment',
  'in_review',
  'approved',
  'rejected',
  'unpublished'
);

-- Admin-managed list of event types (fishing competition, market, ...).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  name_ms text not null check (char_length(name_ms) between 1 and 60),
  name_en text not null check (char_length(name_en) between 1 and 60),
  active boolean not null default true,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 90),
  organiser_id uuid not null references public.organisers (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 140),
  description text not null check (char_length(description) between 1 and 8000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  state text not null check (char_length(state) between 2 and 60),
  district text not null check (char_length(district) between 2 and 80),
  venue text not null check (char_length(venue) between 2 and 160),
  location extensions.geography(point, 4326),
  fee_myr integer not null default 0 check (fee_myr >= 0),
  status public.event_status not null default 'draft',
  rejection_reason text,
  featured_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An event cannot end before it starts.
  constraint events_ends_after_starts check (ends_at is null or ends_at >= starts_at)
);

alter table public.events enable row level security;

create index events_status_starts_idx on public.events (status, starts_at);
create index events_organiser_idx on public.events (organiser_id);
create index events_category_idx on public.events (category_id);

create table public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.event_images enable row level security;

create index event_images_event_idx on public.event_images (event_id);

-- Categories: anyone reads the active ones; admins read all. Only admins write
-- (through normal authenticated writes guarded by the policy).
create policy "categories: public reads active, admin reads all"
  on public.categories for select
  using (active or public.is_admin());

create policy "categories: admins insert"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

create policy "categories: admins update"
  on public.categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert (slug, name_ms, name_en, active, position) on public.categories to authenticated;
grant update (slug, name_ms, name_en, active, position) on public.categories to authenticated;

-- Events:
--  - anyone can read an approved event;
--  - an organiser reads and edits their own events (any status);
--  - an organiser creates events only for themselves and only as a draft;
--  - admins read everything.
create policy "events: public reads approved, owner and admin read all"
  on public.events for select
  using (
    status = 'approved'
    or public.is_admin()
    or organiser_id = auth.uid()
  );

create policy "events: owner creates own draft"
  on public.events for insert
  to authenticated
  with check (
    organiser_id = auth.uid()
    and public.is_active_user()
    and status = 'draft'
  );

create policy "events: owner edits own while active"
  on public.events for update
  to authenticated
  using (organiser_id = auth.uid() and public.is_active_user())
  with check (organiser_id = auth.uid());

revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;
-- status, rejection_reason and featured_until are never client-writable; they
-- change only through the admin function and the payment flow (task 4).
grant insert (
  slug, organiser_id, category_id, title, description,
  starts_at, ends_at, state, district, venue, location, fee_myr
) on public.events to authenticated;
grant update (
  slug, category_id, title, description,
  starts_at, ends_at, state, district, venue, location, fee_myr
) on public.events to authenticated;

create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

-- Event images: readable when the parent event is readable; writable by the
-- event's owner.
create policy "event_images: read when the event is readable"
  on public.event_images for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_images.event_id
        and (e.status = 'approved' or public.is_admin() or e.organiser_id = auth.uid())
    )
  );

create policy "event_images: owner writes"
  on public.event_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_images.event_id and e.organiser_id = auth.uid()
    )
  );

create policy "event_images: owner deletes"
  on public.event_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_images.event_id and e.organiser_id = auth.uid()
    )
  );

revoke all on public.event_images from anon, authenticated;
grant select on public.event_images to anon, authenticated;
grant insert (event_id, storage_path, position) on public.event_images to authenticated;
grant delete on public.event_images to authenticated;

-- Admin-only: approve, reject or unpublish an event, and audit it in the same
-- transaction. A rejection must carry a reason.
create function public.set_event_status(
  target uuid,
  new_status public.event_status,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can change event status' using errcode = '42501';
  end if;
  if new_status not in ('approved', 'rejected', 'unpublished') then
    raise exception 'admins can only approve, reject or unpublish' using errcode = '22023';
  end if;
  if new_status = 'rejected' and coalesce(trim(reason), '') = '' then
    raise exception 'a rejection reason is required' using errcode = '22023';
  end if;

  update public.events
    set status = new_status,
        rejection_reason = case when new_status = 'rejected' then reason else null end
    where id = target;
  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    'event.set_status',
    'event',
    target::text,
    jsonb_build_object('status', new_status, 'reason', reason)
  );
end;
$$;

revoke all on function public.set_event_status(uuid, public.event_status, text)
  from public, anon;
grant execute on function public.set_event_status(uuid, public.event_status, text)
  to authenticated;

-- Seed the launch categories (fishing-first). Idempotent.
insert into public.categories (slug, name_ms, name_en, position) values
  ('competition', 'Pertandingan memancing', 'Fishing competition', 1),
  ('market', 'Pasar basah', 'Coastal market', 2),
  ('pond', 'Kolam pancing', 'Fishing pond', 3),
  ('community', 'Komuniti', 'Community', 4)
on conflict (slug) do nothing;
