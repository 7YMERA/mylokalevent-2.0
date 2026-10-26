-- RLS and function tests for organisers.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- Three users: an admin, and two members who will apply to be organisers.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local', '{"display_name": "Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ali@test.local', '{"display_name": "Ali"}'),
  ('00000000-0000-0000-0000-00000000000c', 'siti@test.local', '{"display_name": "Siti"}');

update public.profiles set role = 'admin'
  where id = '00000000-0000-0000-0000-00000000000a';

-- Ali applies to be an organiser
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$insert into public.organisers (id, slug, name, phone, state)
    values ('00000000-0000-0000-0000-00000000000b', 'ali-fishing', 'Ali Fishing Club', '0123456789', 'Terengganu')$$,
  'a member can apply to be an organiser');

select is(
  (select verification::text from public.organisers where id = '00000000-0000-0000-0000-00000000000b'),
  'none', 'a new organiser starts unverified');

-- Ali cannot self-verify, directly or by editing the column
select throws_ok(
  $$insert into public.organisers (id, slug, name, verification)
    values ('00000000-0000-0000-0000-00000000000b', 'x', 'X', 'verified')$$,
  null, null, 'a member cannot apply as already-verified');

update public.organisers set verification = 'verified'
  where id = '00000000-0000-0000-0000-00000000000b';
select is(
  (select verification::text from public.organisers where id = '00000000-0000-0000-0000-00000000000b'),
  'none', 'a member cannot self-verify by editing the column');

-- Ali can edit their own public fields
select lives_ok(
  $$update public.organisers set name = 'Ali Pancing Club' where id = '00000000-0000-0000-0000-00000000000b'$$,
  'an organiser can edit their own details');

-- Ali cannot apply on someone else's behalf
select throws_ok(
  $$insert into public.organisers (id, slug, name)
    values ('00000000-0000-0000-0000-00000000000c', 'siti-co', 'Siti Co')$$,
  '42501', null, 'a member cannot apply as another user');

-- An unverified organiser is not publicly visible
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is_empty('select * from public.organisers',
  'an unverified organiser is hidden from the public');

-- A member cannot change verification
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select throws_ok(
  $$select public.set_organiser_verification('00000000-0000-0000-0000-00000000000b', 'verified', 'me')$$,
  '42501', null, 'a member cannot verify organisers');

-- An admin verifies Ali, which audits and promotes the role
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select lives_ok(
  $$select public.set_organiser_verification('00000000-0000-0000-0000-00000000000b', 'verified', 'ssm checked')$$,
  'an admin can verify an organiser');
select is(
  (select verification::text from public.organisers where id = '00000000-0000-0000-0000-00000000000b'),
  'verified', 'the organiser is now verified');
select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'organiser', 'verifying promotes the profile to organiser');
select results_eq(
  $$select action, target_id from public.audit_log where action = 'organiser.set_verification'$$,
  $$values ('organiser.set_verification', '00000000-0000-0000-0000-00000000000b')$$,
  'verification is written to the audit log');
select throws_ok(
  $$select public.set_organiser_verification('99999999-9999-9999-9999-999999999999', 'verified', 'nobody')$$,
  'P0002', null, 'verifying a missing organiser fails');
select throws_ok(
  $$select public.set_organiser_verification('00000000-0000-0000-0000-00000000000b', 'rejected', '  ')$$,
  '22023', null, 'a reason is required');

-- Now Ali is verified, the public can read the row
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select results_eq(
  $$select slug from public.organisers$$,
  $$values ('ali-fishing')$$,
  'a verified organiser is publicly readable');

-- Another member still cannot read an unverified peer, but sees the verified one
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select results_eq(
  $$select slug from public.organisers$$,
  $$values ('ali-fishing')$$,
  'a member sees verified organisers');

select * from finish();
rollback;
