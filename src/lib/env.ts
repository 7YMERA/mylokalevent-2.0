import { z } from "zod";

// Values copied from .env.example that must never reach a running server.
const PLACEHOLDER = /^$|^(change-?me|replace-me|xxx+|todo)$|your-/i;

const required = z
  .string()
  .trim()
  .refine((value) => !PLACEHOLDER.test(value), {
    message: "is missing or still set to a placeholder",
  });

// Server-side environment. Add each new variable here and to .env.example.
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // "on" shows "Continue with Google". Leave it off until the Google provider
  // is set up in Supabase, or the button leads to an error page.
  GOOGLE_SIGN_IN: z.enum(["on", "off"]).default("off"),
  NEXT_PUBLIC_SITE_URL: required.pipe(z.url()),
  NEXT_PUBLIC_SUPABASE_URL: required.pipe(z.url()),
  // Publishable (anon-level) key: safe in the browser, limited by RLS.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: required,
  // Server-only, bypasses RLS. Used by the Stripe webhook and cron only.
  SUPABASE_SECRET_KEY: z.string().trim().optional(),
  // Payments (task 4). Optional so the app boots without Stripe configured,
  // but the payment flow refuses to run until all three are set.
  STRIPE_SECRET_KEY: z.string().trim().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().trim().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().trim().optional(),
  // Transactional email (receipts, task 4.4 / 6.4). Optional: emails are
  // skipped (with a server log) when unset, so nothing else breaks.
  RESEND_API_KEY: z.string().trim().optional(),
  EMAIL_FROM: z.string().trim().optional(),
});

export type Env = z.infer<typeof serverSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = serverSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Copy .env.example to .env.local and fill it in.\n${problems}`,
    );
  }
  return result.data;
}

let cached: Env | undefined;

// Validated environment for server code. instrumentation.ts already checked
// it at startup, so this only parses once per process.
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
