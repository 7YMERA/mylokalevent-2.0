import "server-only";

import { env } from "@/lib/env";

type SendResult = { sent: boolean; reason?: string };

// Send a transactional email via Resend. If RESEND_API_KEY / EMAIL_FROM aren't
// configured, this is a safe no-op (logged) — the caller must not treat a
// missing email as a failure of the thing that triggered it (e.g. a payment).
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const { RESEND_API_KEY, EMAIL_FROM } = env();
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.warn("[email] skipped — RESEND_API_KEY/EMAIL_FROM not configured");
    return { sent: false, reason: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status);
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] send error", error);
    return { sent: false, reason: "exception" };
  }
}

// A plain receipt for a confirmed payment. Kept simple and inline (no template
// engine); amounts are whole MYR.
export function paymentReceiptEmail(args: {
  purpose: "listing" | "featured";
  amountMyr: number;
  eventTitle: string;
}): { subject: string; html: string; text: string } {
  const what =
    args.purpose === "listing"
      ? `Event listing: ${args.eventTitle}`
      : `Featured placement: ${args.eventTitle}`;
  const subject = `MyLokalEvent receipt — RM${args.amountMyr}`;
  const text = `Thank you for your payment.\n\n${what}\nAmount: RM${args.amountMyr}\n\nThis is your receipt from MyLokalEvent.`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px">
    <h2>Thank you for your payment</h2>
    <p>${what}</p>
    <p><strong>Amount: RM${args.amountMyr}</strong></p>
    <p style="color:#666">This is your receipt from MyLokalEvent.</p>
  </div>`;
  return { subject, html, text };
}

// Email an organiser the outcome of an admin review of their event.
export function eventDecisionEmail(args: {
  decision: "approved" | "rejected";
  eventTitle: string;
  reason?: string | null;
  eventUrl?: string;
}): { subject: string; html: string; text: string } {
  if (args.decision === "approved") {
    const subject = `Your event is live: ${args.eventTitle}`;
    const link = args.eventUrl ? `\n\nView it: ${args.eventUrl}` : "";
    const text = `Good news — your event "${args.eventTitle}" has been approved and is now live on MyLokalEvent.${link}`;
    const html = `<div style="font-family:system-ui,sans-serif;max-width:480px">
      <h2>Your event is live</h2>
      <p>Your event <strong>${args.eventTitle}</strong> has been approved and is now live on MyLokalEvent.</p>
      ${args.eventUrl ? `<p><a href="${args.eventUrl}">View your event</a></p>` : ""}
    </div>`;
    return { subject, html, text };
  }

  const reason = args.reason?.trim() || "No reason was provided.";
  const subject = `Your event needs changes: ${args.eventTitle}`;
  const text = `Your event "${args.eventTitle}" was not approved.\n\nReason: ${reason}\n\nYou can edit it and submit it again from your organiser dashboard.`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px">
    <h2>Your event needs changes</h2>
    <p>Your event <strong>${args.eventTitle}</strong> was not approved.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p style="color:#666">You can edit it and submit it again from your organiser dashboard.</p>
  </div>`;
  return { subject, html, text };
}
