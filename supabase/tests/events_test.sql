-- RLS and function tests for categories, events and event images.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Users: an admin, and two members. Ali is an organiser; Siti is not.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local', '{"display_name": "Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ali@test.local', '{"display_name": "Ali"}'),
  ('00000000-0000-0000-0000-00000000000c', 'siti@test.local', '{"display_name": "Siti"}');

update public.profiles set role = 'admin'
  where id = '00000000-0000-0000-0000-00000000000a';

-- Ali is a verified organiser (organiser id = profile id = auth uid).
insert into public.organisers (id, slug, name, verification) values
  ('00000000-0000-0000-0000-00000000000b', 'ali-fishing', 'Ali Fishing Club', 'verified');

-- Seed categories are present and only active ones are public
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is(
  (select count(*)::int from public.categories),
  4, 'the four launch categories are seeded and publicly visible');

-- Ali creates a draft event for himself
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$insert into public.events (slug, organiser_id, category_id, title, description, starts_at, state, district, venue)
    select 'jom-pancing', '00000000-0000-0000-0000-00000000000b', c.id,
           'Jom Pancing 2026', 'Shore fishing tournament.',
           now() + interval '7 days', 'Terengganu', 'Kuala Nerus', 'Pantai Batu Burok'
    from public.categories c where c.slug = 'competition'$$,
  'an organiser can create a draft event');

select is(
  (select status::text from public.events where slug = 'jom-pancing'),
  'draft', 'a new event starts as a draft');

-- Ali cannot set status directly (column not granted)
select throws_ok(
  $$update public.events set status = 'approved' where slug = 'jom-pancing'$$,
  '42501', null, 'an organiser cannot write the status column');

-- Ali can edit his own event's granted fields
select lives_ok(
  $$update public.events set title = 'Jom Pancing Terengganu 2026' where slug = 'jom-pancing'$$,
  'an organiser can edit their own event');

-- Ali cannot create an event for another organiser id
select throws_ok(
  $$insert into public.events (slug, organiser_id, category_id, title, description, starts_at, state, district, venue)
    select 'not-mine', '00000000-0000-0000-0000-00000000000c', c.id, 'X', 'Y',
           now() + interval '1 day', 'Sabah', 'Kota Kinabalu', 'Jetty'
    from public.categories c where c.slug = 'market'$$,
  '42501', null, 'an organiser cannot create an event for someone else');

-- Ends-before-starts is rejected by the check constraint
select throws_ok(
  $$insert into public.events (slug, organiser_id, category_id, title, description, starts_at, ends_at, state, district, venue)
    select 'bad-time', '00000000-0000-0000-0000-00000000000b', c.id, 'Bad', 'Bad',
           now() + interval '2 days', now() + interval '1 day', 'Terengganu', 'Marang', 'Spot'
    from public.categories c where c.slug = 'pond'$$,
  '23514', null, 'an event cannot end before it starts');

-- A draft is not visible to the public
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is_empty('select * from public.events',
  'a draft event is hidden from the public');

-- A member cannot change event status
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select throws_ok(
  $$select public.set_event_status(
      (select id from public.events where slug = 'jom-pancing'), 'approved', null)$$,
  '42501', null, 'a member cannot approve events');

-- Admin rejects without a reason -> fails
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select throws_ok(
  $$select public.set_event_status(
      (select id from public.events where slug = 'jom-pancing'), 'rejected', '  ')$$,
  '22023', null, 'rejecting needs a reason');

-- Admin cannot set an invalid status via the function
select throws_ok(
  $$select public.set_event_status(
      (select id from public.events where slug = 'jom-pancing'), 'draft', null)$$,
  '22023', null, 'the function only allows approve/reject/unpublish');

-- Admin approves the event
select lives_ok(
  $$select public.set_event_status(
      (select id from public.events where slug = 'jom-pancing'), 'approved', null)$$,
  'an admin can approve an event');
select is(
  (select status::text from public.events where slug = 'jom-pancing'),
  'approved', 'the event is now approved');
select results_eq(
  $$select action from public.audit_log where action = 'event.set_status'$$,
  $$values ('event.set_status')$$,
  'the approval is written to the audit log');

-- Now approved, the public can read it
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select results_eq(
  $$select slug from public.events$$,
  $$values ('jom-pancing')$$,
  'an approved event is publicly readable');

-- Event images follow the event's visibility
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$insert into public.event_images (event_id, storage_path)
    select id, 'events/jom-pancing/1.webp' from public.events where slug = 'jom-pancing'$$,
  'an owner can add an event image');

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is(
  (select count(*)::int from public.event_images),
  1, 'an image on an approved event is publicly readable');

-- A non-admin cannot write a category
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select throws_ok(
  $$insert into public.categories (slug, name_ms, name_en) values ('x', 'X', 'X')$$,
  '42501', null, 'a member cannot create a category');

select * from finish();
rollback;
