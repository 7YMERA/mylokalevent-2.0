-- Storage bucket for event photos (task 3.2).
-- Private bucket: images are served through signed URLs / the app, never by
-- guessing a path. The app re-encodes every upload server-side to strip EXIF
-- (including GPS) and stores it under a non-guessable name, so these policies
-- only need to gate who may write and delete within an event's own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Path convention: 'events/<event_id>/<random>.webp'. An organiser may write
-- and delete objects for an event they own; admins may manage all; reads go
-- through server-generated signed URLs, so no public read policy is granted.
create policy "event-images: owner writes own event folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and exists (
      select 1 from public.events e
      where e.id::text = (storage.foldername(name))[2]
        and e.organiser_id = auth.uid()
    )
  );

create policy "event-images: owner deletes own event folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (
      public.is_admin()
      or exists (
        select 1 from public.events e
        where e.id::text = (storage.foldername(name))[2]
          and e.organiser_id = auth.uid()
      )
    )
  );
