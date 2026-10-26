# KIRO-NOTES — handoff for the next session (Claude / another device)

> Working notes, not product docs. The source of truth for scope is
> `.kiro/specs/mvp/` (requirements.md, design.md, tasks.md). This file just
> says where we are and how this codebase actually works, so you can pick up
> fast. Update it when you finish a slice.

Last updated: 2026-10-26.

## Where we are

- **Task 1 (Foundation): DONE** — Next.js + TS, Supabase, `profiles` table + RLS,
  email auth with httpOnly cookies, i18n (ms/en), CI.
- **Task 2 (Organisers): IN PROGRESS on branch `feat/organisers`.**
  - **2.1 DB layer — DONE, merged-pending in [PR #11](https://github.com/7YMERA/mylokalevent-2.0/pull/11).** CI green (incl. the `database` pgTAP job).
  - **2.2 public organiser page — DONE (this branch).**
  - **2.3 admin verify flow — DONE (this branch).**
- **Tasks 3–7: NOT STARTED** (events, payments, admin dashboard, engagement, launch).

## Product decisions locked (confirm before building payments)

- Listing fee: **RM10**. Featured: **RM20 for 7 days**.
- Rejected after paying: **free resubmit once, no refund**.
- Fresh-catch listings + fishing-spot directory: **after launch**.

## What's in the Organisers slice (files to read)

DB (task 2.1):

- `supabase/migrations/20261026040000_organisers.sql` — `organisers` table,
  `organiser_verification` enum, RLS, and the `set_organiser_verification()`
  security-definer function (admin-only; promotes profile to `organiser` role
  on verify; writes the audit log — all one transaction).
- `supabase/tests/organisers_test.sql` — 17 pgTAP checks.

App (tasks 2.2 + 2.3):

- `src/lib/organisers.ts` — server-only data access (getVerifiedOrganiser,
  listReviewableOrganisers).
- `src/app/[locale]/o/[slug]/page.tsx` — public organiser page (2.2). Verified
  badge, events stub (events land in task 3).
- `src/app/[locale]/admin/organisers/page.tsx` — admin review queue (2.3),
  admin-guarded (non-admin → notFound).
- `src/app/[locale]/admin/organisers/review-row.tsx` — client row, verify/reject form.
- `src/app/[locale]/admin/organisers/actions.ts` — server action calling the RPC.
- `src/lib/supabase/database.types.ts` — hand-written types extended with
  organisers + the function. (Regenerate once local Supabase runs.)
- `src/messages/{en,ms}.json` — added `organiser` + `admin` sections.

## Conventions this repo follows (match these, don't invent new ones)

- **Every table has RLS.** Privileged writes go through a `security definer`
  Postgres function that (a) checks the caller, (b) does the change, and
  (c) writes `audit_log` — in one transaction. Copy the shape of
  `set_user_status` / `set_organiser_verification`.
- **Client never writes privileged columns.** We `revoke all` then grant only
  specific columns (e.g. `verification` is NOT granted — admins change it only
  via the function). Tests must respect this: a client naming an ungranted
  column gets error `42501`, so don't write a test that expects a silent no-op.
- **Data access is server-only** (`import "server-only"`). `getClaims()` verifies
  the JWT; never trust the cookie. Render DAL reads behind `<Suspense>`.
- **Server Actions get the locale from a hidden `locale` form field**, not the URL.
- **i18n:** keys must be identical in `en.json` and `ms.json` (enforced by
  `src/messages/messages.test.ts`) and keep the same `{placeholders}`.
- **No emojis in UI** (user preference): use stroke/outline SVG icons.
  Typographic glyphs (checkmark, arrows) are fine.
- **Colours:** use design-system tokens only (`text-success`, `bg-success-soft`,
  `bg-warning-soft`, `border-danger`, …) — never literal hex or `bg-white`.
  Tokens are defined in `src/app/globals.css` under `@theme inline`. The user
  likes tasteful colour/tints for contrast in both light and dark mode.
- **Git:** pushing to `main` is blocked. Work on a feature branch → PR → review.

## How to build & verify locally (Windows)

`node_modules` is gitignored, so after cloning on a new device:

```powershell
cd <repo>
# one-time: allow npm/npx scripts
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

npm ci
npm run typecheck   # runs `next typegen` first, then tsc --noEmit
npm run lint        # eslint
npm run format:check
npm test            # vitest
```

### Database tests (need Docker)

```powershell
supabase start      # needs Docker Desktop running
supabase test db    # applies migrations + runs supabase/tests/*.sql
supabase stop
```

If you don't have Docker: **CI runs the DB tests on every push** (the `database`
job in `.github/workflows/ci.yml`), so you can rely on the PR's green check.

## Known gotchas (real, hit this session)

- `npx supabase ...` can fail with `spawn UNKNOWN` on Windows. Install the CLI
  as a real binary instead (`scoop install supabase`) and call `supabase ...`.
- `next lint` is removed in this Next version — the lint script is just `eslint`.
- `src/styles/contrast.test.ts` **fails locally on Windows** (`selector not found`)
  but **passes in CI on Linux** — it's an environment/CSS-parse quirk, not a real
  failure. Don't "fix" it by editing tokens.
- Typecheck needs Next's generated route types: run `next typegen` (the
  `typecheck` script already does) or you'll see bogus `Cannot find name
'LayoutProps'` errors in `layout.tsx`.

## Next steps (suggested order)

1. Merge PR #11 (2.1) if not already merged; this branch stacks 2.2 + 2.3 on it.
2. Add an **"apply to be an organiser"** form for members (the DB insert policy
   already allows a member to create their own `none` row — the UI isn't built).
3. Task 3 (Events): the organiser page has an events stub ready to fill.
