-- Expose event coordinates for the map (task 3.4).
-- `location` is a PostGIS geography(point); PostgREST can't easily project
-- ST_X/ST_Y inline, so we add stored generated columns the client can select
-- directly. Null when no location is set.

alter table public.events
  add column lng double precision
    generated always as (
      case when location is null then null
      else extensions.st_x(location::extensions.geometry) end
    ) stored,
  add column lat double precision
    generated always as (
      case when location is null then null
      else extensions.st_y(location::extensions.geometry) end
    ) stored;

-- The generated columns inherit the table's RLS; the existing column grants
-- cover SELECT (events is granted select to anon, authenticated). No extra
-- grant needed because we granted SELECT on the whole table, not per-column.
