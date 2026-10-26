-- Google sign-in: profile name from Google metadata, and consent recorded
-- after the fact through accept_privacy_notice().
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'aminah@gmail.test',
   '{"full_name": "Aminah Yusof", "name": "Aminah Yusof", "email_verified": true}'),
  ('00000000-0000-0000-0000-0000000000d2', 'ravi@gmail.test',
   '{"name": "Ravi Kumar"}');

select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'),
  'Aminah Yusof', 'a Google sign-up uses the full name');
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'),
  'Ravi Kumar', 'falls back to the name field');
select ok(
  (select consented_at is null from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'),
  'a Google sign-up starts without consent');

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok($$select public.accept_privacy_notice('en')$$, '42501', null,
  'anon cannot call accept_privacy_notice');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated"}';
select lives_ok($$select public.accept_privacy_notice('en')$$,
  'a signed-in user can accept the privacy notice');

reset role;
select ok(
  (select consented_at is not null and locale = 'en'
     from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'),
  'consent and language are recorded for that user');
select ok(
  (select consented_at is null from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'),
  'other users are untouched');

select * from finish();
rollback;
