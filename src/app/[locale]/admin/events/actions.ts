"use server";

import { revalidatePath } from "next/cache";

import { localePath } from "@/i18n/config";
import { formLocale } from "@/lib/auth-schemas";
import { getCurrentUser } from "@/lib/auth";
import { eventDecisionEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

  // Notify the organiser by email. A missing/failing email must NOT fail the
  // decision — the status change is already stored and audited. Reading the
  // organiser's email needs the service role (auth.users is admin-only), so
  // this uses the service client, same as the webhook.
  try {
    const service = createServiceClient();
    if (service) {
      const { data: ev } = await service
        .from("events")
        .select("title, slug, organiser_id")
        .eq("id", target)
        .single();
      if (ev) {
        const { data: userRes } = await service.auth.admin.getUserById(
          ev.organiser_id,
        );
        const to = userRes?.user?.email;
        if (to) {
          const locale = formLocale(formData);
          const eventUrl =
            decision === "approved"
              ? `${env().NEXT_PUBLIC_SITE_URL}${localePath(locale, `/events/${ev.slug}`)}`
              : undefined;
          const mail = eventDecisionEmail({
            decision,
            eventTitle: ev.title,
            reason: decision === "rejected" ? reason : null,
            eventUrl,
          });
          await sendEmail({ to, ...mail });
        }
      }
    }
  } catch (emailError) {
    console.error("[admin] decision email failed", emailError);
  }

  revalidatePath(localePath(formLocale(formData), "/admin/events"));
  return { ok: true };
}
