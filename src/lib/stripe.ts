import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

// A configured Stripe client, or null if payments aren't set up yet. Callers
// MUST handle null and refuse the operation rather than pretending it worked.
let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = env().STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

export function paymentsConfigured(): boolean {
  const e = env();
  return Boolean(
    e.STRIPE_SECRET_KEY &&
    e.STRIPE_WEBHOOK_SECRET &&
    e.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}
