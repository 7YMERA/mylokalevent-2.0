-- Profiles, roles and the admin audit log (tasks 1.3 and 2.3 groundwork).
-- Every table has RLS enabled; privileged changes go through
-- security-definer functions that check the caller and write the audit log.

create type public.user_role as enum ('member', 'organiser', 'admin');
create type public.user_status as enum ('active', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  role public.user_role not null default 'member',
  status public.user_status not null default 'active',
  locale text not null default 'ms' check (locale in ('ms', 'en')),
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Helpers used by policies. Security definer so they can read profiles
-- without recursing through the profiles policies.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

-- Profiles: users see and edit only their own row; admins see all.
-- Role and status are never writable from the client (column grants below).
create policy "profiles: read own or admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles: update own while active"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and public.is_active_user())
  with check (id = auth.uid());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;

-- Audit log: admins can read; nobody can write directly.
create policy "audit_log: admins read"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create a profile for every new auth user. Consent comes from the signup
-- form's metadata; role and status always start at their defaults.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale, consented_at)
  values (
    new.id,
    coalesce(
      nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), ''),
      split_part(new.email, '@', 1)
    ),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ms' end,
    case when (new.raw_user_meta_data ->> 'privacy_consent') = 'true' then now() end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin-only: suspend or reactivate a user, sign them out everywhere,
-- and record it in the audit log in the same transaction.
create function public.set_user_status(
  target uuid,
  new_status public.user_status,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can change user status' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'admins cannot change their own status' using errcode = '42501';
  end if;
  if coalesce(trim(reason), '') = '' then
    raise exception 'a reason is required' using errcode = '22023';
  end if;

  update public.profiles set status = new_status where id = target;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  if new_status = 'suspended' then
    delete from auth.sessions where user_id = target;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    'user.set_status',
    'profile',
    target::text,
    jsonb_build_object('status', new_status, 'reason', reason)
  );
end;
$$;

revoke all on function public.set_user_status(uuid, public.user_status, text) from public, anon;
grant execute on function public.set_user_status(uuid, public.user_status, text) to authenticated;
