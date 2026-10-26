import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PublicOrganiser = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  state: string | null;
};

export type PendingOrganiser = {
  id: string;
  slug: string;
  name: string;
  state: string | null;
  ssmNumber: string | null;
  verification: "none" | "pending" | "verified" | "rejected";
};

// A verified organiser by slug, or null. RLS only ever returns a verified
// row to an anonymous reader, so a non-verified slug reads as not-found.
export async function getVerifiedOrganiser(
  slug: string,
): Promise<PublicOrganiser | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisers")
    .select("id, slug, name, phone, state, verification")
    .eq("slug", slug)
    .single();

  if (!data || data.verification !== "verified") return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    phone: data.phone,
    state: data.state,
  };
}

// Organisers waiting on an admin decision. RLS returns all rows to an admin;
// a non-admin gets only their own, so this is empty for them (the page also
// guards on role).
export async function listReviewableOrganisers(): Promise<PendingOrganiser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisers")
    .select("id, slug, name, state, ssm_number, verification")
    .in("verification", ["none", "pending"])
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    state: row.state,
    ssmNumber: row.ssm_number,
    verification: row.verification,
  }));
}
