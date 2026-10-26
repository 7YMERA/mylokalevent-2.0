"use server";

import { revalidatePath } from "next/cache";

import { localePath } from "@/i18n/config";
import { formLocale } from "@/lib/auth-schemas";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type DecisionState = { error?: string; ok?: boolean };

// Approve or reject an in-review event. The security-definer DB function does
// the real admin check and audits it; this adds a server-side guard.
export async function decideEvent(
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

  if (typeof target !== "string" || !target) return { error: "actionFailed" };
  if (decision !== "approved" && decision !== "rejected") {
    return { error: "actionFailed" };
  }
  if (decision === "rejected" && reason.length === 0) {
    return { error: "reasonRequired" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_event_status", {
    target,
    new_status: decision,
    reason: decision === "rejected" ? reason : null,
  });
  if (error) return { error: "actionFailed" };

  revalidatePath(localePath(formLocale(formData), "/admin/events"));
  return { ok: true };
}
