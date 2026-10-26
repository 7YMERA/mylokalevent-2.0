-- Review guards (follow-up to tasks 2.1, 3.1 and 4.1).
-- 1. Only a VERIFIED organiser may create events or pay to list them. The app
--    already checks this; these rules make the database enforce it too, so a
--    direct API call can't skip it.
-- 2. Changing what the public sees sends it back for review: an approved
--    event whose content changes returns to in_review, and a verified
--    organiser who changes their name or SSM number returns to pending.
-- 3. An event can't be edited while it waits on payment or review, so the
--    admin approves exactly what they read.
-- 4. Owners may read their event's photo folder (for the upload flow).

-- 1. Verified organisers only.
drop policy "events: owner creates own draft" on public.events;
create policy "events: verified owner creates own draft"
  on public.events for insert
  to authenticated
  with check (
    organiser_id = auth.uid()
    and public.is_active_user()
    and public.is_verified_organiser(auth.uid())
    and status = 'draft'
  );

-- 3. Edits only in draft, rejected or approved (approved goes back to review,
--    see the trigger below).
drop policy "events: owner edits own while active" on public.events;
create policy "events: owner edits own while editable"
  on public.events for update
  to authenticated
  using (
    organiser_id = auth.uid()
    and public.is_active_user()
    and status in ('draft', 'rejected', 'approved')
  )
  with check (organiser_id = auth.uid());

-- 2. Approved event content changed -> back to in_review. Admin and payment
-- changes (status, rejection_reason, featured_until) don't touch these
-- columns, so they never trigger it.
create function public.events_rereview_on_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'approved' and (
    new.slug is distinct from old.slug
    or new.category_id is distinct from old.category_id
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at
    or new.state is distinct from old.state
    or new.district is distinct from old.district
    or new.venue is distinct from old.venue
    or new.location is distinct from old.location
    or new.fee_myr is distinct from old.fee_myr
  ) then
    new.status := 'in_review';
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;

create trigger events_rereview_on_edit
  before update on public.events
  for each row execute function public.events_rereview_on_edit();

-- 2. Verified organiser identity changed -> back to pending review.
create function public.organisers_rereview_on_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.verification = 'verified' and (
    new.name is distinct from old.name
    or new.ssm_number is distinct from old.ssm_number
  ) and new.verification = 'verified' then
    new.verification := 'pending';
  end if;
  return new;
end;
$$;

create trigger organisers_rereview_on_edit
  before update on public.organisers
  for each row execute function public.organisers_rereview_on_edit();

-- 1. Payment start re-checks verification. Same signature and behaviour as
-- the task 4.1 version, plus the verified check.
create or replace function public.start_event_payment(
  target_event uuid,
  session_id text,
  amount integer,
  purpose public.payment_purpose,
  featured_days integer default 0
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  current_status public.event_status;
begin
  select organiser_id, status into owner, current_status
    from public.events where id = target_event;
  if owner is null then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  if owner <> auth.uid() then
    raise exception 'not your event' using errcode = '42501';
  end if;
  if not public.is_verified_organiser(owner) then
    raise exception 'only verified organisers can pay' using errcode = '42501';
  end if;

  if purpose = 'listing' and current_status not in ('draft', 'rejected') then
    raise exception 'event is not awaiting a listing payment' using errcode = '22023';
  end if;
  if purpose = 'featured' and current_status <> 'approved' then
    raise exception 'only approved events can buy featured placement'
      using errcode = '22023';
  end if;

  insert into public.payments
    (user_id, event_id, purpose, amount_myr, featured_days, stripe_session_id)
  values
    (auth.uid(), target_event, purpose, amount, featured_days, session_id);

  if purpose = 'listing' then
    update public.events set status = 'awaiting_payment' where id = target_event;
  end if;
end;
$$;

-- Photo uploads now go browser -> Storage (uploads/<event_id>/...), then the
-- server re-encodes them into events/<event_id>/. The server reads the
-- original with the organiser's own session, so the owner (and admins) may
-- read their event's folder. Everyone else still only gets signed URLs.
create policy "event-images: owner reads own event folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'event-images'
    and (
      public.is_admin()
      or exists (
        select 1 from public.events e
        where e.id::text = (storage.foldername(name))[2]
          and e.organiser_id = auth.uid()
      )
    )
  );
