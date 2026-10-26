import "server-only";

import { createClient } from "@/lib/supabase/server";

// Whether the current user has saved this event. False when signed out.
export async function isEventSaved(eventId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return false;
  const { data } = await supabase
    .from("saved_events")
    .select("event_id")
    .eq("user_id", uid)
    .eq("event_id", eventId)
    .maybeSingle();
  return Boolean(data);
}

// Whether the current user follows this organiser. False when signed out.
export async function isFollowingOrganiser(
  organiserId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return false;
  const { data } = await supabase
    .from("follows")
    .select("organiser_id")
    .eq("user_id", uid)
    .eq("organiser_id", organiserId)
    .maybeSingle();
  return Boolean(data);
}

export type SavedEvent = {
  slug: string;
  title: string;
  categorySlug: "competition" | "market" | "pond" | "community";
  startsAt: string;
  state: string;
  remind: boolean;
};

// The current user's saved events (approved ones), soonest first.
export async function listSavedEvents(): Promise<SavedEvent[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return [];

  const { data } = await supabase
    .from("saved_events")
    .select(
      "remind, events(slug, title, starts_at, state, status, categories(slug))",
    )
    .eq("user_id", uid);

  const rows = (data ?? []) as unknown as Array<{
    remind: boolean;
    events: {
      slug: string;
      title: string;
      starts_at: string;
      state: string;
      status: string;
      categories: { slug: string } | { slug: string }[] | null;
    } | null;
  }>;

  return rows
    .filter((row) => row.events && row.events.status === "approved")
    .map((row) => {
      const ev = row.events!;
      const cat = Array.isArray(ev.categories)
        ? ev.categories[0]
        : ev.categories;
      return {
        slug: ev.slug,
        title: ev.title,
        categorySlug: cat?.slug as SavedEvent["categorySlug"],
        startsAt: ev.starts_at,
        state: ev.state,
        remind: row.remind,
      };
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
