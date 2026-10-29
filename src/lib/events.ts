import "server-only";

import { createClient } from "@/lib/supabase/server";

export type EventDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: "competition" | "market" | "pond" | "community";
  startsAt: string;
  endsAt: string | null;
  state: string;
  district: string;
  venue: string;
  feeMyr: number;
  organiser: { slug: string; name: string } | null;
  imagePaths: string[];
};

// A published (approved) event by slug, with its organiser and image paths,
// or null. RLS returns an approved event to anyone, so a draft reads as
// not-found for the public.
export async function getApprovedEvent(
  slug: string,
): Promise<EventDetail | null> {
  const supabase = await createClient();
  const { data: raw } = await supabase
    .from("events")
    .select(
      `id, slug, title, description, starts_at, ends_at, state, district,
       venue, fee_myr, status,
       categories ( slug ),
       organisers ( slug, name ),
       event_images ( storage_path, position )`,
    )
    .eq("slug", slug)
    .single();

  // Our hand-written Database types don't model embedded relationships, so the
  // joined shape is described locally. (Regenerate types once Supabase runs
  // locally and this cast can go.)
  type Joined = {
    id: string;
    slug: string;
    title: string;
    description: string;
    starts_at: string;
    ends_at: string | null;
    state: string;
    district: string;
    venue: string;
    fee_myr: number;
    status: string;
    categories: { slug: string } | { slug: string }[] | null;
    organisers:
      | { slug: string; name: string }
      | { slug: string; name: string }[]
      | null;
    event_images: { storage_path: string; position: number }[] | null;
  };
  const data = raw as Joined | null;

  if (!data || data.status !== "approved") return null;

  const category = Array.isArray(data.categories)
    ? data.categories[0]
    : data.categories;
  const organiser = Array.isArray(data.organisers)
    ? data.organisers[0]
    : data.organisers;
  const images = (data.event_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => image.storage_path);

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    categorySlug: category?.slug as EventDetail["categorySlug"],
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    state: data.state,
    district: data.district,
    venue: data.venue,
    feeMyr: data.fee_myr,
    organiser: organiser
      ? { slug: organiser.slug, name: organiser.name }
      : null,
    imagePaths: images,
  };
}

// Events awaiting an admin decision (in_review), oldest first. RLS returns all
// events to an admin; the page also guards on role.
export async function listEventsInReview(): Promise<
  Array<{
    id: string;
    slug: string;
    title: string;
    state: string;
    district: string;
    venue: string;
    startsAt: string;
    organiserName: string | null;
  }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, state, district, venue, starts_at, status, organisers(name)",
    )
    .eq("status", "in_review")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    slug: string;
    title: string;
    state: string;
    district: string;
    venue: string;
    starts_at: string;
    organisers: { name: string } | { name: string }[] | null;
  }>;

  return rows.map((row) => {
    const org = Array.isArray(row.organisers)
      ? row.organisers[0]
      : row.organisers;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      state: row.state,
      district: row.district,
      venue: row.venue,
      startsAt: row.starts_at,
      organiserName: org?.name ?? null,
    };
  });
}

export type Category = {
  slug: string;
  nameMs: string;
  nameEn: string;
};

export type EventSearchResult = {
  slug: string;
  title: string;
  categorySlug: "competition" | "market" | "pond" | "community";
  startsAt: string;
  state: string;
  district: string;
  venue: string;
  feeMyr: number;
  lat: number | null;
  lng: number | null;
};

export type EventSearchFilters = {
  keyword?: string;
  state?: string;
  categorySlug?: string;
  freeOnly?: boolean;
};

// Approved, upcoming events matching the filters, soonest first. All reads go
// through RLS, which only returns approved events to the public.
export async function searchApprovedEvents(
  filters: EventSearchFilters,
): Promise<EventSearchResult[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(
      "slug, title, starts_at, state, district, venue, fee_myr, lat, lng, status, category_id, categories(slug)",
    )
    .eq("status", "approved")
    .order("starts_at", { ascending: true })
    .limit(60);

  if (filters.state) query = query.eq("state", filters.state);
  if (filters.freeOnly) query = query.eq("fee_myr", 0);
  if (filters.keyword) {
    // Match the keyword in the title or the venue.
    const term = `%${filters.keyword}%`;
    query = query.or(`title.ilike.${term},venue.ilike.${term}`);
  }

  const { data } = await query;
  let rows = (data ?? []) as unknown as Array<{
    slug: string;
    title: string;
    starts_at: string;
    state: string;
    district: string;
    venue: string;
    fee_myr: number;
    lat: number | null;
    lng: number | null;
    categories: { slug: string } | { slug: string }[] | null;
  }>;

  const categorySlugOf = (row: (typeof rows)[number]) =>
    (Array.isArray(row.categories) ? row.categories[0] : row.categories)?.slug;

  if (filters.categorySlug) {
    rows = rows.filter((row) => categorySlugOf(row) === filters.categorySlug);
  }

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    categorySlug: categorySlugOf(row) as EventSearchResult["categorySlug"],
    startsAt: row.starts_at,
    state: row.state,
    district: row.district,
    venue: row.venue,
    feeMyr: row.fee_myr,
    lat: row.lat,
    lng: row.lng,
  }));
}

export type FeedEvent = {
  slug: string;
  title: string;
  categorySlug: EventSearchResult["categorySlug"];
  startsAt: string;
  state: string;
  district: string;
  venue: string;
  feeMyr: number;
  organiser: { slug: string; name: string } | null;
};

// The homepage feed: approved events that haven't ended yet, soonest first,
// optionally one category. Public read through RLS, so it works signed out.
export async function listFeedEvents(
  categorySlug?: string,
): Promise<FeedEvent[]> {
  const supabase = await createClient();
  // Keep today's events in the feed until the day is over (Malaysian time).
  const startOfToday = new Date(
    `${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" })}T00:00:00+08:00`,
  ).toISOString();

  // An inner join lets the category filter run in the database, so the limit
  // applies to matching events only.
  let query = supabase
    .from("events")
    .select(
      `slug, title, starts_at, state, district, venue, fee_myr, status,
       categories${categorySlug ? "!inner" : ""}(slug), organisers(slug, name)`,
    )
    .eq("status", "approved")
    .gte("starts_at", startOfToday)
    .order("starts_at", { ascending: true })
    .limit(30);
  if (categorySlug) query = query.eq("categories.slug", categorySlug);

  const { data } = await query;

  const one = <T>(value: T | T[] | null) =>
    Array.isArray(value) ? value[0] : value;
  const rows = (data ?? []) as unknown as Array<{
    slug: string;
    title: string;
    starts_at: string;
    state: string;
    district: string;
    venue: string;
    fee_myr: number;
    categories: { slug: string } | { slug: string }[] | null;
    organisers:
      | { slug: string; name: string }
      | { slug: string; name: string }[]
      | null;
  }>;

  return rows.map((row) => {
    const organiser = one(row.organisers);
    return {
      slug: row.slug,
      title: row.title,
      categorySlug: one(row.categories)?.slug as FeedEvent["categorySlug"],
      startsAt: row.starts_at,
      state: row.state,
      district: row.district,
      venue: row.venue,
      feeMyr: row.fee_myr,
      organiser: organiser
        ? { slug: organiser.slug, name: organiser.name }
        : null,
    };
  });
}

export type MyEvent = {
  id: string;
  slug: string;
  title: string;
  status:
    | "draft"
    | "awaiting_payment"
    | "in_review"
    | "approved"
    | "rejected"
    | "unpublished";
  startsAt: string;
  rejectionReason: string | null;
};

// The current organiser's own events (any status), newest first.
export async function listMyEvents(): Promise<MyEvent[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return [];

  const { data } = await supabase
    .from("events")
    .select("id, slug, title, status, starts_at, rejection_reason")
    .eq("organiser_id", uid)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    startsAt: row.starts_at,
    rejectionReason: row.rejection_reason,
  }));
}

// Active categories for the event form's category picker.
export async function listActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("slug, name_ms, name_en, active, position")
    .eq("active", true)
    .order("position", { ascending: true });

  return (data ?? []).map((row) => ({
    slug: row.slug,
    nameMs: row.name_ms,
    nameEn: row.name_en,
  }));
}

// A short-lived signed URL for a private storage object, or null.
export async function signedImageUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("event-images")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
