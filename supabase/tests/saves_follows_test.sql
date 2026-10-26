-- RLS tests for saved_events and follows.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000b', 'ali@test.local', '{"display_name": "Ali"}'),
  ('00000000-0000-0000-0000-00000000000c', 'siti@test.local', '{"display_name": "Siti"}');

-- A verified organiser with one approved event.
insert into public.organisers (id, slug, name, verification) values
  ('00000000-0000-0000-0000-00000000000b', 'ali-fishing', 'Ali Fishing Club', 'verified');
insert into public.events (id, slug, organiser_id, category_id, title, description, starts_at, state, district, venue, status)
select '00000000-0000-0000-0000-0000000000e1', 'jom-pancing',
       '00000000-0000-0000-0000-00000000000b', c.id, 'Jom Pancing', 'Desc here please.',
       now() + interval '7 days', 'Terengganu', 'Kuala Nerus', 'Pantai', 'approved'
from public.categories c where c.slug = 'competition';

-- Siti saves the event and follows the organiser.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select lives_ok(
  $$insert into public.saved_events (user_id, event_id)
    values ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-0000000000e1')$$,
  'a member can save an event');
select lives_ok(
  $$insert into public.follows (user_id, organiser_id)
    values ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000b')$$,
  'a member can follow an organiser');
select is(
  (select count(*)::int from public.saved_events),
  1, 'the member sees their own save');

-- Siti cannot save on someone else's behalf.
select throws_ok(
  $$insert into public.saved_events (user_id, event_id)
    values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e1')$$,
  '42501', null, 'a member cannot save for another user');

-- Siti can toggle her reminder off.
select lives_ok(
  $$update public.saved_events set remind = false
    where user_id = '00000000-0000-0000-0000-00000000000c'$$,
  'a member can turn off their reminder');

-- Ali (another member) sees none of Siti's saves or follows.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select is_empty(
  'select * from public.saved_events',
  'a member cannot see another member''s saves');
select is_empty(
  'select * from public.follows',
  'a member cannot see another member''s follows');

-- Ali cannot delete Siti's save: the delete runs but RLS scopes it to Ali's
-- own (zero) rows, so Siti's save must still be there when SITI looks.
select lives_ok(
  $$delete from public.saved_events where user_id = '00000000-0000-0000-0000-00000000000c'$$,
  'a delete by another member runs but is scoped to their own rows');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select is(
  (select count(*)::int from public.saved_events),
  1, 'Siti''s save survived another member''s delete attempt');

-- Anonymous visitors cannot read saves at all.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  'select * from public.saved_events',
  '42501', null, 'anon cannot read saved_events');

select * from finish();
rollback;
