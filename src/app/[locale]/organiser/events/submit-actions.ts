"use server";

import { redirect } from "next/navigation";

import { localePath } from "@/i18n/config";
import { formLocale } from "@/lib/auth-schemas";
import { getCurrentUser } from "@/lib/auth";
import { LISTING_FEE_MYR, toStripeAmount } from "@/lib/pricing";
import { env } from "@/lib/env";
import { getStripe, paymentsConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export type SubmitState = { error?: string };

// Submit a draft event for review: create a Stripe Checkout session for the
// listing fee, record a pending payment + move the event to awaiting_payment,
// then send the organiser to Stripe. The event only becomes `in_review` when
// the signed webhook later calls confirm_payment — never here.
export async function submitEventForReview(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const eventId = formData.get("eventId");
  const locale = formLocale(formData);
  if (typeof eventId !== "string" || !eventId) return { error: "generic" };

  if (!paymentsConfigured()) return { error: "paymentsUnavailable" };
  const stripe = getStripe();
  if (!stripe) return { error: "paymentsUnavailable" };

  const user = await getCurrentUser();
  if (!user) return { error: "notOrganiser" };

  const supabase = await createClient();
  // Confirm the caller owns this event and it's in a payable state.
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, organiser_id, status")
    .eq("id", eventId)
    .single();
  if (!event || event.organiser_id !== user.id)
    return { error: "notOrganiser" };
  if (event.status !== "draft" && event.status !== "rejected") {
    return { error: "generic" };
  }

  const base = env().NEXT_PUBLIC_SITE_URL;
  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // FPX and GrabPay are enabled on the Stripe account (dashboard), not here;
      // "card" is always available. Stripe shows whatever MYR methods are on.
      payment_method_types: ["card", "fpx", "grabpay"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "myr",
            unit_amount: toStripeAmount(LISTING_FEE_MYR),
            product_data: { name: `Event listing: ${event.title}` },
          },
        },
      ],
      metadata: { event_id: event.id, purpose: "listing" },
      success_url: `${base}${localePath(locale, `/organiser/events/${event.slug}/paid`)}`,
      cancel_url: `${base}${localePath(locale, "/organiser")}`,
    });
    checkoutUrl = session.url;

    // Record the pending payment and move the event to awaiting_payment.
    const { error } = await supabase.rpc("start_event_payment", {
      target_event: event.id,
      session_id: session.id,
      amount: LISTING_FEE_MYR,
      purpose: "listing",
      featured_days: 0,
    });
    if (error) return { error: "generic" };
  } catch {
    return { error: "generic" };
  }

  if (!checkoutUrl) return { error: "generic" };
  redirect(checkoutUrl);
}
