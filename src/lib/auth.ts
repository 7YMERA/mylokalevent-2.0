import "server-only";

import { redirect } from "next/navigation";

import { localePath } from "@/i18n/config";
import { getLocale } from "@/i18n/messages";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: "member" | "organiser" | "admin";
  status: "active" | "suspended";
  locale: "ms" | "en";
  // False for Google sign-ups until they accept the privacy notice.
  consented: boolean;
};

// The one place that reads the session (Data Access Layer). getClaims()
// verifies the JWT rather than trusting the cookie. Reads the request, so
// callers must render behind a <Suspense> boundary.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, status, locale, consented_at")
    .eq("id", claims.sub)
    .single();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    displayName: profile.display_name,
    role: profile.role,
    status: profile.status,
    locale: profile.locale,
    consented: profile.consented_at !== null,
  };
}

// For pages that need a signed-in user who has accepted the privacy notice.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(localePath(await getLocale(), "/sign-in"));
  if (!user.consented) redirect(localePath(await getLocale(), "/welcome"));
  return user;
}
