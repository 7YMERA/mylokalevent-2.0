-- Google sign-in (task 1.4).
-- Google sends the user's name as full_name/name rather than our display_name,
-- and OAuth cannot carry the privacy-consent tick from our form, so consent
-- is recorded afterwards through accept_privacy_notice().

create or replace function public.handle_new_user()
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
      nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 80), ''),
      nullif(left(trim(new.raw_user_meta_data ->> 'name'), 80), ''),
      split_part(new.email, '@', 1)
    ),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ms' end,
    case when (new.raw_user_meta_data ->> 'privacy_consent') = 'true' then now() end
  );
  return new;
end;
$$;

-- Records the signed-in user's consent to the privacy notice, once, and the
-- language they were using. Users cannot set consented_at directly, so the
-- timestamp always comes from the server.
create function public.accept_privacy_notice(new_locale text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  update public.profiles
  set
    consented_at = coalesce(consented_at, now()),
    locale = case when new_locale in ('ms', 'en') then new_locale else locale end
  where id = auth.uid();
end;
$$;

revoke execute on function public.accept_privacy_notice(text) from public, anon;
grant execute on function public.accept_privacy_notice(text) to authenticated;
