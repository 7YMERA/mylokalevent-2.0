-- Organisers and their verification (task 2.1).
-- One organiser row per profile. Verification moves through states; only
-- admins flip it, through a security-definer function that audits the change
-- in the same transaction (mirrors set_user_status in the profiles migration).

create type public.organiser_verification as enum
  ('none', 'pending', 'verified', 'rejected');

create table public.organisers (
  id uuid primary key references public.profiles (id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name text not null check (char_length(name) between 2 and 120),
  phone text check (char_length(phone) between 6 and 20),
  state text check (char_length(state) between 2 and 60),
  ssm_number text check (char_length(ssm_number) between 4 and 40),
  verification public.organiser_verification not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organisers enable row level security;

-- An organiser is publicly visible only once verified.
create function public.is_verified_organiser(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organisers
    where id = target and verification = 'verified'
  );
$$;

-- Read: the owner reads their own row; admins read all; anyone (including
-- anonymous visitors) may read a verified organiser's public row.
create policy "organisers: read own, admin, or verified"
  on public.organisers for select
  using (
    id = auth.uid()
    or public.is_admin()
    or verification = 'verified'
  );

-- Apply: an active member creates exactly their own organiser row, and can
-- only ever create it at 'none' (the WITH CHECK forbids self-verifying).
create policy "organisers: apply for self while active"
  on public.organisers for insert
  to authenticated
  with check (
    id = auth.uid()
    and public.is_active_user()
    and verification = 'none'
  );

-- Edit: the owner edits their own row while active. The verification column
-- is not client-writable (column grants below), so edits cannot change it.
create policy "organisers: update own while active"
  on public.organisers for update
  to authenticated
  using (id = auth.uid() and public.is_active_user())
  with check (id = auth.uid());

revoke all on public.organisers from anon, authenticated;
grant select on public.organisers to anon, authenticated;
grant insert (id, slug, name, phone, state, ssm_number) on public.organisers to authenticated;
grant update (slug, name, phone, state, ssm_number) on public.organisers to authenticated;

create trigger organisers_touch_updated_at
  before update on public.organisers
  for each row execute function public.touch_updated_at();

-- Admin-only: move an organiser to pending/verified/rejected, promote the
-- profile to the 'organiser' role when verified, and audit it in one
-- transaction. Same shape as set_user_status.
create function public.set_organiser_verification(
  target uuid,
  new_verification public.organiser_verification,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can change organiser verification'
      using errcode = '42501';
  end if;
  if coalesce(trim(reason), '') = '' then
    raise exception 'a reason is required' using errcode = '22023';
  end if;

  update public.organisers
    set verification = new_verification
    where id = target;
  if not found then
    raise exception 'organiser not found' using errcode = 'P0002';
  end if;

  -- A verified organiser becomes an organiser-role profile.
  if new_verification = 'verified' then
    update public.profiles set role = 'organiser'
      where id = target and role = 'member';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    'organiser.set_verification',
    'organiser',
    target::text,
    jsonb_build_object('verification', new_verification, 'reason', reason)
  );
end;
$$;

revoke all on function
  public.set_organiser_verification(uuid, public.organiser_verification, text)
  from public, anon;
grant execute on function
  public.set_organiser_verification(uuid, public.organiser_verification, text)
  to authenticated;
