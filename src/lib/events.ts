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
      { slug: string; name: string } | { slug: string; name: string }[] | null;
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

export type Category = {
  slug: string;
  nameMs: string;
  nameEn: string;
};

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
