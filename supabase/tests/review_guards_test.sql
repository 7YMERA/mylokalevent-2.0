-- Tests for the review guards: verified-only event creation and payment,
-- re-review after edits, and no edits while waiting on payment or review.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local', '{"display_name": "Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ali@test.local', '{"display_name": "Ali"}'),
  ('00000000-0000-0000-0000-00000000000c', 'siti@test.local', '{"display_name": "Siti"}');
update public.profiles set role = 'admin'
  where id = '00000000-0000-0000-0000-00000000000a';

-- Ali is verified; Siti has applied but is not verified yet.
insert into public.organisers (id, slug, name, ssm_number, verification) values
  ('00000000-0000-0000-0000-00000000000b', 'ali-fishing', 'Ali Fishing Club', '202601000001', 'verified'),
  ('00000000-0000-0000-0000-00000000000c', 'siti-pasar', 'Pasar Siti', null, 'pending');

-- Ali's events: one approved, one in review, one draft (created as admin).
insert into public.events (id, slug, organiser_id, category_id, title, description, starts_at, state, district, venue, status)
select v.id::uuid, v.slug, '00000000-0000-0000-0000-00000000000b', c.id,
       v.title, 'Shore fishing tournament.', now() + interval '7 days',
       'Terengganu', 'Kuala Nerus', 'Pantai Batu Burok', v.status::public.event_status
from public.categories c,
  (values
    ('00000000-0000-0000-0000-0000000000e1', 'jom-pancing', 'Jom Pancing 2026', 'approved'),
    ('00000000-0000-0000-0000-0000000000e2', 'pancing-malam', 'Pancing Malam', 'in_review'),
    ('00000000-0000-0000-0000-0000000000e3', 'pancing-pagi', 'Pancing Pagi', 'draft')
  ) as v (id, slug, title, status)
where c.slug = 'competition';

-- Siti (not verified) cannot create an event or pay through the API.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select throws_ok(
  $$insert into public.events (slug, organiser_id, category_id, title, description, starts_at, state, district, venue)
    select 'siti-event', '00000000-0000-0000-0000-00000000000c', id, 'Pasar Ahad',
           'Fresh catch.', now() + interval '3 days', 'Terengganu', 'Marang', 'Jeti Marang'
    from public.categories where slug = 'market'$$,
  '42501', null, 'an unverified organiser cannot create an event');

-- Ali (verified) can.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$insert into public.events (slug, organiser_id, category_id, title, description, starts_at, state, district, venue)
    select 'ali-event', '00000000-0000-0000-0000-00000000000b', id, 'Pasar Ali',
           'Fresh catch.', now() + interval '3 days', 'Terengganu', 'Marang', 'Jeti Marang'
    from public.categories where slug = 'market'$$,
  'a verified organiser can create an event');

-- Editing an approved event's content sends it back to review.
update public.events set title = 'Jom Pancing 2026 (new prizes)'
  where id = '00000000-0000-0000-0000-0000000000e1';
reset role;
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'in_review', 'editing an approved event sends it back to review');
select is(
  (select title from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'Jom Pancing 2026 (new prizes)', 'the edit itself is kept');

-- An event in review can't be edited (the update matches no rows).
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
update public.events set title = 'Swapped after payment'
  where id = '00000000-0000-0000-0000-0000000000e2';
reset role;
select is(
  (select title from public.events where id = '00000000-0000-0000-0000-0000000000e2'),
  'Pancing Malam', 'an event in review cannot be edited');

-- A draft is still freely editable and stays a draft.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
update public.events set title = 'Pancing Pagi Raya'
  where id = '00000000-0000-0000-0000-0000000000e3';
reset role;
select is(
  (select status::text || ':' || title from public.events where id = '00000000-0000-0000-0000-0000000000e3'),
  'draft:Pancing Pagi Raya', 'a draft can be edited and stays a draft');

-- Admin approval still works and is not undone by the trigger.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select lives_ok(
  $$select public.set_event_status('00000000-0000-0000-0000-0000000000e1', 'approved')$$,
  'an admin can re-approve the edited event');
reset role;
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'approved', 'the re-approved event is approved');

-- Siti cannot start a payment while unverified (even for an event she owns).
insert into public.events (id, slug, organiser_id, category_id, title, description, starts_at, state, district, venue)
select '00000000-0000-0000-0000-0000000000e4', 'siti-old-draft', '00000000-0000-0000-0000-00000000000c',
       c.id, 'Pasar Siti', 'Fresh catch.', now() + interval '3 days', 'Terengganu', 'Marang', 'Jeti Marang'
from public.categories c where c.slug = 'market';
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select throws_ok(
  $$select public.start_event_payment('00000000-0000-0000-0000-0000000000e4', 'cs_test_siti', 'listing')$$,
  '42501', null, 'an unverified organiser cannot start a payment');

-- Ali can still pay for his draft.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$select public.start_event_payment('00000000-0000-0000-0000-0000000000e3', 'cs_test_ali', 'listing')$$,
  'a verified organiser can start a payment');

-- A verified organiser changing their phone stays verified...
update public.organisers set phone = '0123456789'
  where id = '00000000-0000-0000-0000-00000000000b';
reset role;
select is(
  (select verification::text from public.organisers where id = '00000000-0000-0000-0000-00000000000b'),
  'verified', 'changing the phone number keeps verification');

-- ...but changing their SSM number sends them back to pending.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
update public.organisers set ssm_number = '202601999999'
  where id = '00000000-0000-0000-0000-00000000000b';
reset role;
select is(
  (select verification::text from public.organisers where id = '00000000-0000-0000-0000-00000000000b'),
  'pending', 'changing the SSM number sends the organiser back to review');

-- Admin verification still sets verified (the trigger only fires on edits
-- of name or SSM number).
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select public.set_organiser_verification('00000000-0000-0000-0000-00000000000b', 'verified', 'SSM re-checked');
reset role;
select is(
  (select verification::text from public.organisers where id = '00000000-0000-0000-0000-00000000000b'),
  'verified', 'an admin can verify again after the change');

select * from finish();
rollback;
