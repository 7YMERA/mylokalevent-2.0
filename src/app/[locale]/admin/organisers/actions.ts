"use server";

import { revalidatePath } from "next/cache";

import { localePath } from "@/i18n/config";
import { formLocale } from "@/lib/auth-schemas";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type DecisionState = { error?: string; ok?: boolean };

// Verify or reject one organiser. The security-definer DB function does the
// real authorisation (admin only) and writes the audit log; this action adds
// a server-side guard and input checks before the round trip.
export async function decideOrganiser(
  _prev: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin" || user.status !== "active") {
    return { error: "notAdmin" };
  }

  const target = formData.get("target");
  const decision = formData.get("decision");
  const reason = (formData.get("reason") ?? "").toString().trim();

  if (typeof target !== "string" || target.length === 0) {
    return { error: "actionFailed" };
  }
  if (decision !== "verified" && decision !== "rejected") {
    return { error: "actionFailed" };
  }
  if (reason.length === 0) {
    return { error: "reasonRequired" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_organiser_verification", {
    target,
    new_verification: decision,
    reason,
  });

  if (error) return { error: "actionFailed" };

  const locale = formLocale(formData);
  revalidatePath(localePath(locale, "/admin/organisers"));
  return { ok: true };
}
