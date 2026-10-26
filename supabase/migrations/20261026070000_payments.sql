-- Payments and Stripe webhook idempotency (task 4).
-- Money state only ever changes inside a single Postgres transaction, and an
-- event is marked paid ONLY by confirm_payment(), which the signed Stripe
-- webhook calls. Nothing here is writable from the browser.

create type public.payment_purpose as enum ('listing', 'featured');
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  purpose public.payment_purpose not null,
  amount_myr integer not null check (amount_myr >= 0),
  -- Days of featured placement bought (featured purpose only).
  featured_days smallint not null default 0 check (featured_days >= 0),
  stripe_session_id text not null unique,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create index payments_user_idx on public.payments (user_id);
create index payments_event_idx on public.payments (event_id);

-- Webhook idempotency: a Stripe event id can be inserted once. A duplicate
-- insert (unique_violation) tells the route it already handled that event.
create table public.stripe_events (
  id text primary key,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

-- Payments: an owner can read their own; nobody writes from the browser.
create policy "payments: owner reads own"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid());

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- stripe_events: no browser access at all (webhook uses the service role).
revoke all on public.stripe_events from anon, authenticated;

-- Move an organiser's own draft event to awaiting_payment and record a pending
-- payment row for a Checkout session. Called by the server action AFTER it has
-- created the Stripe Checkout session. Security definer so it can write the
-- payment row (which is otherwise browser-read-only), but it re-checks that the
-- caller owns the event.
create function public.start_event_payment(
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

  -- Listing payment is only valid from a draft or a rejected event
  -- (rejected events may resubmit once without paying again — see note below,
  -- but the paid path is still supported for a fresh submission).
  if purpose = 'listing' and current_status not in ('draft', 'rejected') then
    raise exception 'event is not awaiting a listing payment' using errcode = '22023';
  end if;
  -- Featured is only for an approved event.
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

revoke all on function
  public.start_event_payment(uuid, text, integer, public.payment_purpose, integer)
  from public, anon;
grant execute on function
  public.start_event_payment(uuid, text, integer, public.payment_purpose, integer)
  to authenticated;

-- Mark a Checkout session paid and apply its effect, in one transaction. Only
-- the webhook (service role) runs this. Idempotent at the payment level: a
-- payment already 'paid' is left alone.
create function public.confirm_payment(session_id text)
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
  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  if pay.status = 'paid' then
    return; -- already applied
  end if;

  update public.payments
    set status = 'paid', paid_at = now()
    where id = pay.id;

  if pay.purpose = 'listing' then
    -- A paid listing moves the event into review.
    update public.events set status = 'in_review'
      where id = pay.event_id and status = 'awaiting_payment';
  elsif pay.purpose = 'featured' then
    -- Extend featured placement from the later of now or the current end.
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
end;
$$;

-- Execution is NOT granted to anon/authenticated: only the service-role key
-- (used by the webhook route) may call this.
revoke all on function public.confirm_payment(text) from public, anon, authenticated;
