# Design: MyLokalEvent 2.0 MVP

## Overview
A Next.js app (TypeScript, App Router) on Vercel talking to Supabase. Public pages are
server-rendered for speed, SEO and WhatsApp previews. Supabase Auth handles sessions in
httpOnly cookies, and Row Level Security decides who can read or change each row, so a
bug in one page cannot expose other users' data. Stripe handles payments; a webhook route
is the only thing that marks a payment as paid.

```
Browser ──► Next.js on Vercel ──► Supabase (Postgres + RLS, Auth, Storage)
                 │    ▲
                 │    └── Stripe webhook (signed) ──► mark payment paid (Postgres function)
                 └──► Stripe Checkout, email provider
```

## Data model
All tables have RLS enabled. `auth.users` is managed by Supabase Auth.

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | One row per user | `id` (= auth user id), `display_name`, `role` (member, organiser, admin), `status` (active, suspended), `locale`, `consented_at` |
| `organisers` | Organiser details | `id` (= profile id), `slug`, `phone`, `state`, `ssm_number`, `verification` (none, pending, verified, rejected) |
| `categories` | Event types, admin-managed | `id`, `slug`, `name_ms`, `name_en`, `active` |
| `events` | Core entity | `id`, `slug`, `organiser_id`, `category_id`, `title`, `description`, `starts_at`, `ends_at`, `state`, `district`, `venue`, `location` (PostGIS point), `fee_myr`, `status` (draft, awaiting_payment, in_review, approved, rejected, unpublished), `rejection_reason`, `featured_until` |
| `event_images` | Images per event | `event_id`, `storage_path`, `position` |
| `saved_events` | Member saves | `user_id`, `event_id`, `remind` |
| `follows` | Member follows organiser | `user_id`, `organiser_id` |
| `payments` | Every payment attempt | `id`, `user_id`, `purpose` (listing, featured), `event_id`, `amount_myr`, `stripe_session_id` (unique), `status` (pending, paid, refunded, failed), `paid_at` |
| `stripe_events` | Webhook idempotency | `id` (Stripe event id, primary key), `received_at` |
| `reports` | User reports | `id`, `reporter_id`, `target_type`, `target_id`, `reason`, `status` |
| `audit_log` | Append-only admin trail | `id`, `actor_id`, `action`, `target_type`, `target_id`, `details`, `created_at` |

States and districts are a fixed reference list in code, so filters stay consistent.

## Access rules (RLS summary)
- Anyone can read `approved` events, their images, categories and organiser profiles.
- Organisers can read and edit their own events while in `draft` or `rejected`; edits to
  approved events go through a server action that re-checks rules and notifies savers.
- Members can read and write only their own `saved_events` and `follows`.
- `payments` are readable by their owner; nobody can write them from the browser.
- Status changes (approve, reject, suspend, verify) only happen through admin-only
  Postgres functions, each writing to `audit_log` in the same transaction.
- `audit_log` allows insert from those functions only; no update or delete for anyone.

## Key flows

### Publishing an event
1. Organiser fills the event form (draft saved as they go).
2. On submit, a server action validates the input and creates a Stripe Checkout session
   with `event_id` and `purpose` in its metadata; event moves to `awaiting_payment`.
3. Stripe calls `/api/stripe/webhook`. The route verifies the signature, inserts the
   Stripe event id into `stripe_events` (a duplicate insert means already handled, so
   it stops), then calls `confirm_payment(session_id)`, which marks the payment paid and
   the event `in_review` in one transaction.
4. Admin approves or rejects; the organiser is emailed either way.

### Featured placement
Same payment flow with `purpose = featured`; on confirmation `featured_until` is
extended by the purchased number of days.

### Reminders and expiry
A scheduled job (Supabase cron) runs hourly: sends day-before reminders for saved
events, notifies followers of newly approved events, and marks ended events.

## Pages
- `/[locale]` home: featured, upcoming, browse by state and category.
- `/[locale]/events` search with filters and map view.
- `/[locale]/events/[slug]` event page (server-rendered, Open Graph, JSON-LD `Event`).
- `/[locale]/o/[slug]` organiser profile.
- `/[locale]/account` profile, saved events, follows, privacy (export, delete).
- `/[locale]/organiser` dashboard: my events, create or edit event, payments.
- `/[locale]/admin` review queue, verifications, reports, categories, revenue, audit log.

## Security notes (how v1's issues are addressed)
| v1 issue | 2.0 approach |
|---|---|
| Wallet balance updated with separate read and write | No wallet in MVP; all money changes happen in single Postgres transactions |
| Unsigned Stripe webhooks accepted when secret missing | Startup check requires the secret; signature always verified; idempotency table |
| Seeded admin and demo passwords in a public repo | No seeded accounts; first admin promoted manually via SQL |
| Service-role key used for every query, no RLS | RLS on every table; anon key in browser; service role only in the webhook and cron |
| JWT in localStorage and `innerHTML` everywhere | httpOnly cookie sessions, React escaping, CSP |
| Suspended users stay signed in for up to 60 minutes | Short-lived access tokens plus a `status` check in RLS and middleware |
| Upload type trusted from the browser, EXIF kept | Byte-level type check, size cap, re-encode images to strip metadata |

## Testing
- Unit tests for validation and pricing.
- RLS tests that run as anonymous, member, organiser and admin users against a local
  Supabase instance.
- Playwright end-to-end: sign up, create event, pay with a Stripe test card, admin
  approve, event appears in search.
