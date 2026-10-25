-- RLS and function tests for profiles and the audit log.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

-- Three users: an admin, a member and another member.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local', '{"display_name": "Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ali@test.local',
   '{"display_name": "Ali", "locale": "en", "privacy_consent": "true"}'),
  ('00000000-0000-0000-0000-00000000000c', 'siti@test.local', '{}');

update public.profiles set role = 'admin'
  where id = '00000000-0000-0000-0000-00000000000a';
insert into auth.sessions (id, user_id)
  values (gen_random_uuid(), '00000000-0000-0000-0000-00000000000b');

-- Signup trigger
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'Ali', 'signup creates a profile with the display name');
select ok(
  (select consented_at is not null from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'signup records privacy consent');
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'siti', 'display name falls back to the email name');
select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'member', 'new users are members');

-- Anonymous visitors see nothing
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok('select * from public.profiles', '42501', null,
  'anon cannot read profiles');

-- A member sees only their own profile
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select results_eq('select id::text from public.profiles',
  $$values ('00000000-0000-0000-0000-00000000000b')$$,
  'a member reads only their own profile');

select lives_ok(
  $$update public.profiles set display_name = 'Ali Baba' where id = '00000000-0000-0000-0000-00000000000b'$$,
  'a member can edit their display name');
select throws_ok(
  $$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000b'$$,
  '42501', null, 'a member cannot change their own role');

update public.profiles set display_name = 'Hacked'
  where id = '00000000-0000-0000-0000-00000000000c';

select throws_ok(
  $$select public.set_user_status('00000000-0000-0000-0000-00000000000c', 'suspended', 'spam')$$,
  '42501', null, 'a member cannot suspend users');
select throws_ok(
  $$insert into public.audit_log (action, target_type, target_id) values ('x', 'y', 'z')$$,
  '42501', null, 'nobody writes the audit log directly');

-- An admin can suspend, which is audited
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select lives_ok(
  $$select public.set_user_status('00000000-0000-0000-0000-00000000000b', 'suspended', 'spam')$$,
  'an admin can suspend a user');
select results_eq(
  $$select action, target_id from public.audit_log$$,
  $$values ('user.set_status', '00000000-0000-0000-0000-00000000000b')$$,
  'the suspension is in the audit log');
select throws_ok(
  $$select public.set_user_status('00000000-0000-0000-0000-00000000000a', 'suspended', 'oops')$$,
  '42501', null, 'an admin cannot suspend themselves');

-- Other members cannot see the audit log
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select is_empty('select * from public.audit_log',
  'a member cannot read the audit log');

-- A suspended member can no longer edit their profile
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
update public.profiles set display_name = 'Back again'
  where id = '00000000-0000-0000-0000-00000000000b';

reset role;
select is_empty(
  $$select 1 from auth.sessions where user_id = '00000000-0000-0000-0000-00000000000b'$$,
  'suspending a user signs them out');
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'Ali Baba', 'a suspended member cannot edit their profile');
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'siti', 'a member cannot edit someone else''s profile');

select * from finish();
rollback;
