-- Saving events and following organisers (task 6.1).
-- Members read and write ONLY their own rows. Everything is keyed to
-- auth.uid(), so a member can never see or change another member's saves or
-- follows.

create table public.saved_events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  remind boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.saved_events enable row level security;

create index saved_events_user_idx on public.saved_events (user_id);
create index saved_events_event_idx on public.saved_events (event_id);

create table public.follows (
  user_id uuid not null references public.profiles (id) on delete cascade,
  organiser_id uuid not null references public.organisers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, organiser_id)
);

alter table public.follows enable row level security;

create index follows_user_idx on public.follows (user_id);
create index follows_organiser_idx on public.follows (organiser_id);

-- saved_events: a member sees and manages only their own saves.
create policy "saved_events: owner reads own"
  on public.saved_events for select
  to authenticated
  using (user_id = auth.uid());

create policy "saved_events: owner saves for self"
  on public.saved_events for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_active_user());

create policy "saved_events: owner updates own"
  on public.saved_events for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "saved_events: owner deletes own"
  on public.saved_events for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on public.saved_events from anon, authenticated;
grant select, delete on public.saved_events to authenticated;
grant insert (user_id, event_id, remind) on public.saved_events to authenticated;
grant update (remind) on public.saved_events to authenticated;

-- follows: a member sees and manages only their own follows.
create policy "follows: owner reads own"
  on public.follows for select
  to authenticated
  using (user_id = auth.uid());

create policy "follows: owner follows for self"
  on public.follows for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_active_user());

create policy "follows: owner unfollows own"
  on public.follows for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on public.follows from anon, authenticated;
grant select, delete on public.follows to authenticated;
grant insert (user_id, organiser_id) on public.follows to authenticated;
