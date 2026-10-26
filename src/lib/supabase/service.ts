import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

import type { Database } from "./database.types";

// A Supabase client using the SERVICE ROLE key, which bypasses RLS. Use ONLY
// in trusted server contexts where RLS cannot express the rule — the Stripe
// webhook and scheduled jobs — never in anything reachable from the browser.
// Returns null if the secret key isn't configured.
export function createServiceClient() {
  const key = env().SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createSupabaseClient<Database>(env().NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
