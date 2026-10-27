"use server";

import { redirect } from "next/navigation";

import { localePath } from "@/i18n/config";
import { formLocale } from "@/lib/auth-schemas";
import { getCurrentUser } from "@/lib/auth";
import {
  LISTING_FEE_MYR,
  FEATURED_FEE_MYR,
  FEATURED_DAYS,
  toStripeAmount,
} from "@/lib/pricing";
import { env } from "@/lib/env";
import { getStripe, paymentsConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export type SubmitState = { error?: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Stripe = NonNullable<ReturnType<typeof getStripe>>;

// Before a new listing checkout, close the organiser's earlier unfinished
// ones so only one can be paid. Returns false if an earlier session has
// already been paid and is waiting on the webhook: paying again would charge
// twice.
async function closeOpenListingSessions(
  supabase: Supabase,
  stripe: Stripe,
  eventId: string,
): Promise<boolean> {
  const { data: pending } = await supabase
    .from("payments")
    .select("stripe_session_id")
    .eq("event_id", eventId)
    .eq("purpose", "listing")
    .eq("status", "pending");
  for (const { stripe_session_id: id } of pending ?? []) {
    const session = await stripe.checkout.sessions.retrieve(id);
    if (session.status === "complete") return false;
    if (session.status === "open") await stripe.checkout.sessions.expire(id);
  }
  return true;
}

// Submit a draft event for review: create a Stripe Checkout session for the
// listing fee, record a pending payment + move the event to awaiting_payment,
// then send the organiser to Stripe. An event already awaiting payment (the
// organiser left Stripe without paying) can start a fresh session. The event only becomes `in_review` when
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
  if (
    event.status !== "draft" &&
    event.status !== "rejected" &&
    event.status !== "awaiting_payment"
  ) {
    return { error: "generic" };
  }

  const base = env().NEXT_PUBLIC_SITE_URL;
  let checkoutUrl: string | null = null;
  try {
    if (!(await closeOpenListingSessions(supabase, stripe, event.id))) {
      return { error: "paymentProcessing" };
    }

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

    // Record the pending payment and move the event to awaiting_payment. The
    // database sets the price; the webhook checks Stripe charged it.
    const { error } = await supabase.rpc("start_event_payment", {
      target_event: event.id,
      session_id: session.id,
      purpose: "listing",
    });
    if (error) return { error: "generic" };
  } catch {
    return { error: "generic" };
  }

  if (!checkoutUrl) return { error: "generic" };
  redirect(checkoutUrl);
}

// Buy featured placement for an APPROVED event. Same Checkout + webhook flow;
// confirm_payment extends featured_until by FEATURED_DAYS when it's paid.
export async function buyFeaturedPlacement(
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
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, organiser_id, status")
    .eq("id", eventId)
    .single();
  if (!event || event.organiser_id !== user.id)
    return { error: "notOrganiser" };
  if (event.status !== "approved") return { error: "generic" };

  const base = env().NEXT_PUBLIC_SITE_URL;
  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "fpx", "grabpay"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "myr",
            unit_amount: toStripeAmount(FEATURED_FEE_MYR),
            product_data: {
              name: `Featured placement (${FEATURED_DAYS} days): ${event.title}`,
            },
          },
        },
      ],
      metadata: { event_id: event.id, purpose: "featured" },
      success_url: `${base}${localePath(locale, `/organiser/events/${event.slug}/paid`)}`,
      cancel_url: `${base}${localePath(locale, "/organiser")}`,
    });
    checkoutUrl = session.url;

    const { error } = await supabase.rpc("start_event_payment", {
      target_event: event.id,
      session_id: session.id,
      purpose: "featured",
    });
    if (error) return { error: "generic" };
  } catch {
    return { error: "generic" };
  }

  if (!checkoutUrl) return { error: "generic" };
  redirect(checkoutUrl);
}
