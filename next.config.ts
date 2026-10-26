import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Baseline CSP without nonces, so pages can stay statically rendered.
// Tighten script-src (nonces or SRI) once third-party scripts are known.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Event photos are served from Supabase Storage through signed URLs.
  `img-src 'self' blob: data: ${supabaseUrl}`,
  "font-src 'self'",
  // The event form uploads photos straight to Supabase Storage.
  `connect-src 'self' ${supabaseUrl}`,
  "object-src 'none'",
  "base-uri 'self'",
  // Server Actions that redirect (Google sign-in via Supabase, Stripe
  // Checkout) are form posts; browsers apply form-action to those redirects.
  `form-action 'self' ${supabaseUrl} https://accounts.google.com https://checkout.stripe.com`,
  "frame-src 'self' https://www.openstreetmap.org",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
