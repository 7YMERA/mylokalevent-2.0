-- Payment fixes (review findings 6-8 in docs/notes/CLAUDE-NOTES.md).
-- 6. The database sets the price. start_event_payment no longer takes an
--    amount or featured days from the caller, and confirm_payment checks that
--    what Stripe charged matches the stored amount before applying anything.
-- 7. An abandoned checkout no longer traps the event: the organiser can pay
--    again from awaiting_payment, and an expired or failed session moves the
--    event back to draft.
-- 8. (webhook side) Only a session Stripe reports as paid is confirmed; the
--    route also handles async_payment_succeeded / _failed and expired.

-- 6. Prices. Keep in step with src/lib/pricing.ts (the app shows these and
-- sends them to Stripe; the webhook rejects a payment that doesn't match).
create function public.payment_price(
  purpose public.payment_purpose,
  out amount_myr integer,
  out featured_days integer
)
language sql
immutable
set search_path = ''
as $$
  select case purpose when 'listing' then 10 when 'featured' then 20 end,
         case purpose when 'listing' then 0 when 'featured' then 7 end;
$$;

grant execute on function public.payment_price(public.payment_purpose)
  to authenticated, service_role;

drop function public.start_event_payment(
  uuid, text, integer, public.payment_purpose, integer
);

-- Record a pending payment for a Checkout session the server action just
-- created. Returns the amount (MYR) the database will expect Stripe to charge.
create function public.start_event_payment(
  target_event uuid,
  session_id text,
  purpose public.payment_purpose
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  current_status public.event_status;
  price record;
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

  -- 7. awaiting_payment is allowed so an organiser who closed Stripe can
  -- start again.
  if purpose = 'listing'
     and current_status not in ('draft', 'rejected', 'awaiting_payment') then
    raise exception 'event is not awaiting a listing payment' using errcode = '22023';
  end if;
  if purpose = 'featured' and current_status <> 'approved' then
    raise exception 'only approved events can buy featured placement'
      using errcode = '22023';
  end if;

  select * into price from public.payment_price(purpose);

  if purpose = 'listing' then
    -- A new listing session replaces any earlier unfinished one. (The server
    -- action expires those sessions on Stripe first.)
    update public.payments
      set status = 'failed'
      where event_id = target_event
        and payments.purpose = 'listing'
        and status = 'pending';
  end if;

  insert into public.payments
    (user_id, event_id, purpose, amount_myr, featured_days, stripe_session_id)
  values
    (auth.uid(), target_event, purpose, price.amount_myr, price.featured_days,
     session_id);

  if purpose = 'listing' then
    update public.events set status = 'awaiting_payment' where id = target_event;
  end if;

  return price.amount_myr;
end;
$$;

revoke all on function
  public.start_event_payment(uuid, text, public.payment_purpose)
  from public, anon;
grant execute on function
  public.start_event_payment(uuid, text, public.payment_purpose)
  to authenticated;

drop function public.confirm_payment(text);

-- Mark a Checkout session paid and apply its effect, in one transaction, but
-- only if Stripe charged the stored amount in MYR. Returns false (and marks
-- the payment failed, audited) on a mismatch. Service role only.
create function public.confirm_payment(
  session_id text,
  amount_total integer,
  paid_currency text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments%rowtype;
begin
  select * into pay from public.payments
    where stripe_session_id = session_id for update;
  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  if pay.status = 'paid' then
    return true; -- already applied
  end if;

  if amount_total is distinct from pay.amount_myr * 100
     or lower(paid_currency) is distinct from 'myr' then
    update public.payments set status = 'failed' where id = pay.id;
    insert into public.audit_log (actor_id, action, target_type, target_id, details)
    values (
      pay.user_id,
      'payment.amount_mismatch',
      'payment',
      pay.id::text,
      jsonb_build_object(
        'expected_sen', pay.amount_myr * 100,
        'amount_total', amount_total,
        'currency', paid_currency
      )
    );
    return false;
  end if;

  -- A superseded ('failed') session that was paid anyway still counts: the
  -- organiser's money arrived, so honour it.
  update public.payments
    set status = 'paid', paid_at = now()
    where id = pay.id;

  if pay.purpose = 'listing' then
    -- A paid listing moves the event into review. draft covers a session that
    -- expired on our side but was paid by a slow method.
    update public.events set status = 'in_review'
      where id = pay.event_id and status in ('awaiting_payment', 'draft');
  elsif pay.purpose = 'featured' then
    update public.events
      set featured_until = greatest(coalesce(featured_until, now()), now())
                           + (pay.featured_days || ' days')::interval
      where id = pay.event_id;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    pay.user_id,
    'payment.confirmed',
    'payment',
    pay.id::text,
    jsonb_build_object('purpose', pay.purpose, 'amount_myr', pay.amount_myr)
  );
  return true;
end;
$$;

revoke all on function public.confirm_payment(text, integer, text)
  from public, anon, authenticated;

-- 7. A Checkout session expired or its payment failed. The pending payment
-- becomes failed, and a listing event waiting only on it goes back to draft
-- so the organiser can edit or pay again. Service role only; idempotent.
create function public.expire_payment(session_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments%rowtype;
begin
  select * into pay from public.payments
    where stripe_session_id = session_id for update;
  if not found or pay.status <> 'pending' then
    return; -- unknown, already paid, or already closed
  end if;

  update public.payments set status = 'failed' where id = pay.id;

  if pay.purpose = 'listing' and not exists (
    select 1 from public.payments p
    where p.event_id = pay.event_id
      and p.purpose = 'listing'
      and p.status = 'pending'
  ) then
    update public.events set status = 'draft'
      where id = pay.event_id and status = 'awaiting_payment';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    pay.user_id,
    'payment.expired',
    'payment',
    pay.id::text,
    jsonb_build_object('purpose', pay.purpose)
  );
end;
$$;

revoke all on function public.expire_payment(text)
  from public, anon, authenticated;
