// Pricing for listings and featured placement. These are the locked launch
// decisions.
// Amounts are whole MYR (ringgit). The database has the same prices in
// public.payment_price() and is the one that counts: the webhook refuses a
// payment whose Stripe amount differs. Change both together.

export const LISTING_FEE_MYR = 10;

export const FEATURED_FEE_MYR = 20;
export const FEATURED_DAYS = 7;

// Stripe wants the smallest currency unit. MYR has 100 sen per ringgit.
export function toStripeAmount(myr: number): number {
  return Math.round(myr * 100);
}
