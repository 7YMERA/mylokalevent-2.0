# Tech stack and engineering rules

## Stack (proposed, confirm before scaffolding)
- **Web app:** Next.js (App Router) with TypeScript, server-rendered event pages.
- **UI:** Tailwind CSS with an accessible component library (shadcn/ui).
- **Backend:** Supabase: Postgres, Auth, Storage, Row Level Security (RLS).
  Business logic that must be atomic (payments, balances) lives in Postgres functions.
- **Payments:** Stripe Checkout in MYR (cards, FPX, GrabPay), confirmed by signed webhooks.
- **Email:** a transactional provider (Resend or Brevo).
- **Hosting:** Vercel for the web app, Supabase cloud (Singapore region) for data.
- **i18n:** built-in Next.js pattern, no library: `[locale]` route segment (`ms`, `en`), JSON messages in `src/messages/`, locale read with `next/root-params`. Server Actions get the locale from a hidden `locale` form field.

## Security rules (non-negotiable)
- The repo is public. Never commit secrets; real values go in `.env` (gitignored) and
  every variable is documented in `.env.example`.
- The app refuses to start if a required secret is missing or set to a placeholder.
- Every table has RLS enabled. The browser only ever uses the anon key. The
  service-role key is used server-side only, and only where RLS cannot express the rule.
- Sessions use Supabase Auth with httpOnly cookies. No tokens in localStorage.
- Never build HTML from strings. Rely on React escaping; no `dangerouslySetInnerHTML`
  on user content. Send a Content Security Policy.
- Payments are only marked paid from a verified Stripe webhook, and webhook handling is
  idempotent (safe to receive the same event twice).
- Uploads: check the real file type from its bytes, cap size, strip EXIF/GPS metadata,
  store with non-guessable names.
- Rate-limit signup, login, posting and reporting; add a CAPTCHA (Cloudflare Turnstile)
  to signup and login.
- Admin actions are written to an append-only audit log.
- No seeded accounts or demo passwords outside local development.

## Quality
- TypeScript strict mode, ESLint, Prettier. A pre-commit hook (Husky + lint-staged)
  formats staged files; if hooks are skipped, run `npm run format` before committing,
  or CI's `format:check` fails.
- Tests: unit tests for logic, tests for RLS policies, Playwright for key user flows.
- CI on every pull request: typecheck, lint, tests, secret scanning.
