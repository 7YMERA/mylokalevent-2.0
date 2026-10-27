-- Tests for payments, the idempotency table, and the money functions.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local', '{"display_name": "Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ali@test.local', '{"display_name": "Ali"}'),
  ('00000000-0000-0000-0000-00000000000c', 'siti@test.local', '{"display_name": "Siti"}');
update public.profiles set role = 'admin'
  where id = '00000000-0000-0000-0000-00000000000a';

insert into public.organisers (id, slug, name, verification) values
  ('00000000-0000-0000-0000-00000000000b', 'ali-fishing', 'Ali Fishing Club', 'verified');

-- Two draft events owned by Ali.
insert into public.events (id, slug, organiser_id, category_id, title, description, starts_at, state, district, venue)
select v.id, v.slug, '00000000-0000-0000-0000-00000000000b', c.id,
       'Jom Pancing 2026', 'Shore fishing tournament.',
       now() + interval '7 days', 'Terengganu', 'Kuala Nerus', 'Pantai Batu Burok'
from public.categories c,
     (values ('00000000-0000-0000-0000-0000000000e1'::uuid, 'jom-pancing'),
             ('00000000-0000-0000-0000-0000000000e2'::uuid, 'jom-pancing-2')) v (id, slug)
where c.slug = 'competition';

-- Prices live in the database (keep in step with src/lib/pricing.ts).
select is(
  (select amount_myr from public.payment_price('listing')), 10,
  'the listing fee is RM10');
select is(
  (select (amount_myr, featured_days)::text from public.payment_price('featured')),
  '(20,7)', 'featured placement is RM20 for 7 days');

-- Ali starts a listing payment for his own draft. The caller can no longer
-- pass an amount: the old five-argument function is gone.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select is(
  public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_1', 'listing'),
  10, 'starting a listing payment returns the database price');
select is(
  (select array_agg(pronargs) from pg_proc where proname = 'start_event_payment'),
  array[3::smallint], 'the caller-priced version of start_event_payment is gone');
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'awaiting_payment', 'starting payment moves the event to awaiting_payment');
select is(
  (select (status, amount_myr)::text from public.payments where stripe_session_id = 'cs_test_1'),
  '(pending,10)', 'the payment row starts pending at the database price');

-- Siti cannot start a payment for Ali's event.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select throws_ok(
  $$select public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_x', 'listing')$$,
  '42501', null, 'a member cannot start a payment for someone else''s event');

-- A member cannot read someone else's payment.
select is_empty(
  $$select * from public.payments where stripe_session_id = 'cs_test_1'$$,
  'a member cannot read another user''s payment');

-- Abandoned checkout: Ali left Stripe, so he starts again from awaiting_payment.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select lives_ok(
  $$select public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_2', 'listing')$$,
  'an organiser can pay again while the event is awaiting payment');
select is(
  (select status::text from public.payments where stripe_session_id = 'cs_test_1'),
  'failed', 'the earlier unfinished session is closed');

-- Nobody authenticated may call the webhook functions.
select throws_ok(
  $$select public.confirm_payment('cs_test_2', 1000, 'myr')$$,
  '42501', null, 'authenticated users cannot confirm payments');
select throws_ok(
  $$select public.expire_payment('cs_test_2')$$,
  '42501', null, 'authenticated users cannot expire payments');

-- As the service role (what the webhook uses).
reset role;

-- The wrong amount is refused and audited, and changes nothing else.
select is(
  public.confirm_payment('cs_test_2', 100, 'myr'), false,
  'a payment for the wrong amount is not confirmed');
select is(
  (select status::text from public.payments where stripe_session_id = 'cs_test_2'),
  'failed', 'the mismatched payment is marked failed');
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'awaiting_payment', 'a mismatched payment does not move the event');
select is(
  (select count(*)::int from public.audit_log where action = 'payment.amount_mismatch'),
  1, 'the mismatch is audited');

-- The right amount, in another currency, is refused too.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$ begin perform public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_3', 'listing'); end $$;
reset role;
select is(
  public.confirm_payment('cs_test_3', 1000, 'usd'), false,
  'a payment in another currency is not confirmed');

-- Pay properly.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$ begin perform public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_4', 'listing'); end $$;
reset role;
select is(
  public.confirm_payment('cs_test_4', 1000, 'myr'), true,
  'the webhook can confirm a payment for the right amount');
select is(
  (select status::text from public.payments where stripe_session_id = 'cs_test_4'),
  'paid', 'the payment is now paid');
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'in_review', 'a paid listing moves the event into review');

-- Idempotent: confirming the same session again changes nothing.
select is(
  public.confirm_payment('cs_test_4', 1000, 'myr'), true,
  'confirming the same session twice is safe');
select is(
  (select count(*)::int from public.audit_log where action = 'payment.confirmed'),
  1, 'a repeated confirm does not double-audit');

-- An expired session sends the event back to draft so it can be paid again.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$ begin perform public.start_event_payment('00000000-0000-0000-0000-0000000000e2', 'cs_test_5', 'listing'); end $$;
reset role;
select lives_ok(
  $$select public.expire_payment('cs_test_5')$$,
  'the webhook can expire a session');
select is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e2'),
  'draft', 'an expired listing session returns the event to draft');
select is(
  (select status::text from public.payments where stripe_session_id = 'cs_test_5'),
  'failed', 'the expired payment is marked failed');

-- Expiring a paid session does nothing.
do $$ begin perform public.expire_payment('cs_test_4'); end $$;
select is(
  (select (p.status, e.status)::text from public.payments p
     join public.events e on e.id = p.event_id
     where p.stripe_session_id = 'cs_test_4'),
  '(paid,in_review)', 'expiring an already paid session changes nothing');

-- The idempotency table rejects a duplicate Stripe event id.
insert into public.stripe_events (id) values ('evt_1');
select throws_ok(
  $$insert into public.stripe_events (id) values ('evt_1')$$,
  '23505', null, 'a Stripe event id can only be recorded once');

-- Featured placement on an approved event is priced by the database and
-- extends featured_until by 7 days.
update public.events set status = 'approved' where id = '00000000-0000-0000-0000-0000000000e1';
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select is(
  public.start_event_payment('00000000-0000-0000-0000-0000000000e1', 'cs_test_feat', 'featured'),
  20, 'featured placement is charged at the database price');
reset role;
do $$ begin perform public.confirm_payment('cs_test_feat', 2000, 'myr'); end $$;
select ok(
  (select featured_until between now() + interval '7 days' - interval '1 minute'
                             and now() + interval '7 days' + interval '1 minute'
     from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'a paid featured placement lasts 7 days');

select * from finish();
rollback;
