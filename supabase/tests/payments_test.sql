-- Tests for payments, the idempotency table, and the money functions.
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

insert into public.organisers (id, slug, name, verification) values
  ('00000000-0000-0000-0000-00000000000b', 'ali-fishing', 'Ali Fishing Club', 'verified');

-- A draft event owned by Ali.
insert into public.events (id, slug, organiser_id, category_id, title, description, starts_at, state, district, venue)
select '00000000-0000-0000-0000-0000000000e1', 'jom-pancing',
       '00000000-0000-0000-0000-00000000000b', c.id,
       'Jom Pancing 2026', 'Shore fishing tournament.',
       now() + interval '7 days', 'Terengganu', 'Kuala Nerus', 'Pantai Batu Burok'
from public.categories c where c.slug = 'competition';

-- Ali starts a listing payment for his own draft.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$select public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_1', 10, 'listing', 0)$$,
  'an organiser can start a listing payment for their draft');
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'awaiting_payment', 'starting payment moves the event to awaiting_payment');
select is(
  (select status::text from public.payments where stripe_session_id = 'cs_test_1'),
  'pending', 'the payment row starts pending');

-- Siti cannot start a payment for Ali's event.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select throws_ok(
  $$select public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_x', 10, 'listing', 0)$$,
  '42501', null, 'a member cannot start a payment for someone else''s event');

-- A member cannot read someone else's payment.
select is_empty(
  $$select * from public.payments where stripe_session_id = 'cs_test_1'$$,
  'a member cannot read another user''s payment');

-- Nobody authenticated may call confirm_payment (webhook/service-role only).
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select throws_ok(
  $$select public.confirm_payment('cs_test_1')$$,
  '42501', null, 'authenticated users cannot confirm payments');

-- As the service role (what the webhook uses), confirm the payment.
reset role;
select lives_ok(
  $$select public.confirm_payment('cs_test_1')$$,
  'the webhook (service role) can confirm a payment');
select is(
  (select status::text from public.payments where stripe_session_id = 'cs_test_1'),
  'paid', 'the payment is now paid');
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'in_review', 'a paid listing moves the event into review');

-- Idempotent: confirming the same session again changes nothing and does not error.
select lives_ok(
  $$select public.confirm_payment('cs_test_1')$$,
  'confirming the same session twice is safe');
select is(
  (select count(*)::int from public.audit_log where action = 'payment.confirmed'),
  1, 'a repeated confirm does not double-audit');

-- The idempotency table rejects a duplicate Stripe event id.
insert into public.stripe_events (id) values ('evt_1');
select throws_ok(
  $$insert into public.stripe_events (id) values ('evt_1')$$,
  '23505', null, 'a Stripe event id can only be recorded once');

-- Featured placement extends featured_until on an approved event.
update public.events set status = 'approved' where id = '00000000-0000-0000-0000-0000000000e1';
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$select public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_feat', 20, 'featured', 7)$$,
  'an organiser can buy featured placement for an approved event');

select * from finish();
rollback;
