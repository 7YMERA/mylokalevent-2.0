import { NextResponse, type NextRequest } from "next/server";

import { paymentReceiptEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;
type CheckoutSession = {
  id: string;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
};

// Forget the event id so Stripe's retry is processed instead of being dropped
// as a duplicate. The payment functions are idempotent, so a retry is safe.
async function retryLater(
  supabase: ServiceClient,
  eventId: string,
  error: string,
) {
  await supabase.from("stripe_events").delete().eq("id", eventId);
  return NextResponse.json({ error }, { status: 500 });
}

async function confirm(
  supabase: ServiceClient,
  eventId: string,
  session: CheckoutSession,
) {
  const { data: confirmed, error } = await supabase.rpc("confirm_payment", {
    session_id: session.id,
    amount_total: session.amount_total ?? -1,
    paid_currency: session.currency ?? "",
  });
  if (error) return retryLater(supabase, eventId, "confirm failed");
  if (!confirmed) {
    // Stripe charged something other than the stored price. The payment is
    // marked failed and audited; an admin refunds it. Retrying won't help.
    console.error("[webhook] amount mismatch on session", session.id);
    return NextResponse.json({ received: true, applied: false });
  }

  // Send a receipt. A missing/failing email must NOT fail the webhook — the
  // payment is already confirmed in the DB (the source of truth).
  try {
    const { data: pay } = await supabase
      .from("payments")
      .select("user_id, purpose, amount_myr, event_id")
      .eq("stripe_session_id", session.id)
      .single();
    if (pay) {
      const [{ data: userRes }, { data: ev }] = await Promise.all([
        supabase.auth.admin.getUserById(pay.user_id),
        supabase.from("events").select("title").eq("id", pay.event_id).single(),
      ]);
      const to = userRes?.user?.email;
      if (to) {
        const receipt = paymentReceiptEmail({
          purpose: pay.purpose,
          amountMyr: pay.amount_myr,
          eventTitle: ev?.title ?? "your event",
        });
        await sendEmail({ to, ...receipt });
      }
    }
  } catch (emailError) {
    console.error("[webhook] receipt email failed", emailError);
  }
  return NextResponse.json({ received: true });
}

// The ONLY place a payment is marked paid. Verifies the Stripe signature,
// dedupes on the Stripe event id, then calls confirm_payment() (paid) or
// expire_payment() (expired / failed) with the service role, the only caller
// allowed to run them.
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = env().STRIPE_WEBHOOK_SECRET;
  const supabase = createServiceClient();
  if (!stripe || !webhookSecret || !supabase) {
    // Payments not configured — refuse rather than silently accept.
    return NextResponse.json(
      { error: "payments not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  // The raw body is required for signature verification.
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  // Idempotency: record the event id first. A duplicate (23505) means we've
  // already handled this event, so acknowledge and stop.
  const { error: dupError } = await supabase
    .from("stripe_events")
    .insert({ id: event.id });
  if (dupError) {
    if (dupError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json(
      { error: "could not record event" },
      { status: 500 },
    );
  }

  const session = event.data.object as CheckoutSession;
  switch (event.type) {
    case "checkout.session.completed":
      // A delayed method (some bank transfers) completes as "unpaid" and
      // reports later through async_payment_succeeded / _failed.
      if (session.payment_status !== "paid") break;
      return confirm(supabase, event.id, session);
    case "checkout.session.async_payment_succeeded":
      return confirm(supabase, event.id, session);
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const { error } = await supabase.rpc("expire_payment", {
        session_id: session.id,
      });
      if (error) return retryLater(supabase, event.id, "expire failed");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
