// Pricing for listings and featured placement. These are the locked launch
// decisions; they live as data so they can change without a schema change.
// Amounts are whole MYR (ringgit).

export const LISTING_FEE_MYR = 10;

export const FEATURED_FEE_MYR = 20;
export const FEATURED_DAYS = 7;

// Stripe wants the smallest currency unit. MYR has 100 sen per ringgit.
export function toStripeAmount(myr: number): number {
  return Math.round(myr * 100);
}
