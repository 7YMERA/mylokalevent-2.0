# KIRO-NOTES — handoff for the next session (Claude / another device)

> Working notes, not product docs. The source of truth for scope is
> `.kiro/specs/mvp/` (requirements.md, design.md, tasks.md). This file just
> says where we are and how this codebase actually works, so you can pick up
> fast. Update it when you finish a slice.

Last updated: 2026-10-26.

## Where we are

- **Task 1 (Foundation): DONE** — Next.js + TS, Supabase, `profiles` table + RLS,
  email auth with httpOnly cookies, i18n (ms/en), CI.
- **Task 2 (Organisers): mostly done on branch `feat/organisers`.**
  - **2.1 DB layer — DONE** (table, RLS, `set_organiser_verification`). In [PR #11](https://github.com/7YMERA/mylokalevent-2.0/pull/11); CI green incl. the `database` pgTAP job.
  - **2.2 public organiser page — DONE.**
  - **2.3 admin verify flow — DONE.**
  - **GAP: the member-facing "apply to be an organiser" FORM is not built yet.**
    The DB insert policy already allows a member to create their own `none` row;
    only the UI is missing. Task 2 isn't fully closed until this ships.
- **Task 3 (Events): 3.1 DONE on branch `feat/organisers`.**
  - **3.1 `categories` + `events` + `event_images` tables, RLS, seed, status function — DONE.**
  - 3.2 event form + image upload — NOT STARTED.
  - 3.3 server-rendered event page (OG, JSON-LD, directions, calendar, share) — NOT STARTED.
    The organiser page already has an events stub ready to fill.
  - 3.4 search, filters, map view — NOT STARTED. `events.location` is a PostGIS
    `geography(point)` ready for the map.
- **Tasks 4–7: NOT STARTED** (payments, moderation/admin, engagement, launch).

## Product decisions locked (confirm before building payments)

- Listing fee: **RM10**. Featured: **RM20 for 7 days**.
- Rejected after paying: **free resubmit once, no refund**.
- Fresh-catch listings + fishing-spot directory: **after launch**.

## What's in the Events slice (files to read, task 3.1)

- `supabase/migrations/20261026050000_events.sql` — enables PostGIS; `event_status`
  enum; `categories`, `events`, `event_images` tables with RLS; `set_event_status()`
  admin-only function (approve/reject/unpublish only, reason required to reject,
  audited); seeds the 4 launch categories.
- `supabase/tests/events_test.sql` — 18 pgTAP checks.
- `src/lib/supabase/database.types.ts` — extended with all three tables,
  `event_status`, and `set_event_status`.

Key RLS: public reads only `approved` events; an organiser reads/edits their own
(any status) but can only CREATE a `draft` and can never write `status`,
`rejection_reason` or `featured_until` (those move via the admin function and the
task-4 payment flow). `organiser_id = auth.uid()` is the ownership check
(organiser id = profile id = auth user id).

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

## Environment, limitations & things I could NOT fully verify

Read this before trusting any "done" above. I (Kiro) built this on the user's
Windows machine through the Kiro Crew agent layer, under real constraints. Where
I could not verify something myself, I say so — don't assume it's proven.

### Host constraints during this work

- **Low RAM (~3.2–3.4 GB free the whole session).** The agent layer repeatedly
  flagged memory pressure and told me to take the "lighter path": run targeted
  tests instead of the full suite, avoid parallel work, defer heavy builds. So:
  - I did **not** run `npm run build` (the full Next production build) locally —
    too heavy for the available memory. CI runs it (`check` job), so build health
    is proven on CI, not on this machine.
  - I did **not** run the full `vitest` suite repeatedly; I ran targeted files
    (translations, auth-schemas). The full suite still runs in CI.
  - If you're on a machine with more RAM, just run everything (`npm test`,
    `npm run build`) — these limits were about the host, not the code.

- **Docker is NOT installed / not yet usable.** I installed Docker Desktop via
  winget this session, but it needs a **reboot + first launch** that the user
  hadn't done by the time I finished. Consequence: I could **never run the pgTAP
  DB tests locally** (`supabase test db` needs Docker). Every claim that a
  migration's tests "pass" is **CI-verified only** (the `database` job on Linux),
  except where a later local run confirms it. The SQL is written to exactly match
  the already-passing `profiles` pattern, but local DB runs were impossible here.

- **PowerShell execution policy blocked `npx`/`.ps1` shims** at first
  (`running scripts is disabled`). Worked around by calling the real binaries in
  `node_modules\.bin\*.cmd` directly, and by having the user allow scripts
  (`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`). If a command
  mysteriously "fails to launch", this is usually why.

- **`npx supabase` itself is flaky on Windows** (`spawn UNKNOWN`). The Supabase
  CLI is now installed as a real binary via Scoop — call `supabase ...` directly,
  not `npx supabase`.

### What is PROVEN vs what is only WRITTEN

| Thing                                              | Status                                                                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 2.1 migration + 17 pgTAP tests                | **Proven** — CI `database` job green on PR #11                                                                                                                                  |
| Tasks 2.2 / 2.3 TypeScript (types, pages, actions) | **Proven locally** — typecheck + eslint + translations test all green                                                                                                           |
| Task 3.1 migration + 18 pgTAP tests                | **Written, NOT yet CI-run** — committed locally, not pushed (user pushes). Mirrors the proven 2.1 pattern, but no green check exists yet. **Verify in CI after the next push.** |
| Task 3.1 types                                     | **Proven locally** — typecheck green                                                                                                                                            |
| Full production build (`npm run build`)            | **Not run locally** (RAM). CI covers it.                                                                                                                                        |

### Known test/tooling quirks (not real bugs)

- `src/styles/contrast.test.ts` **fails locally on Windows** (`selector not
found`) but **passes in CI on Linux** — an environment/CSS-parse quirk. Do NOT
  "fix" it by editing design tokens. Confirmed by stashing my changes and seeing
  it still fail on a clean tree.
- `next lint` is removed in this Next version — the lint script is just `eslint`.
- Typecheck needs Next's generated route types: run `next typegen` first (the
  `typecheck` script already chains it) or you'll see bogus `Cannot find name
'LayoutProps'` errors in `layout.tsx` — those are NOT from new code.
- Hand-written `database.types.ts`: I maintain it by hand to match migrations.
  Once local Supabase runs, regenerate it (`supabase gen types typescript
--local`) and delete the drift risk.

### Workflow constraints I operated under

- **No pushing to `main`** (blocked by policy, and correct). All work is on
  `feat/organisers`.
- **User pushes & merges themselves.** From partway through the session the user
  asked me to keep the branch open as a cloud-sync and NOT push. So local commits
  may be **ahead of the remote** — check `git log origin/feat/organisers..HEAD`.
- I gave git a repo-local identity (`7YMERA`) because none was configured; commits
  are authored as that.

### If you (Claude) have MORE capability than I did here

You likely can run the full suite and Docker. First thing worth doing: push the
branch, confirm CI is green on 3.1, then run `supabase test db` locally once Docker
is up to double-check the two migrations I could only CI-verify. After that, the
`database.types.ts` regeneration above removes the main hand-maintenance risk.

## Next steps (suggested order)

1. **Push `feat/organisers` and confirm CI** — especially the `database` job for
   the new 3.1 migration, which has not been CI-run yet.
2. **Finish task 2.1's gap:** build the member-facing "apply to be an organiser"
   form (DB policy already allows it; only UI missing).
3. **Task 3.2:** event create/edit form with draft saving + safe image upload
   (byte-level type check, size cap, strip EXIF, non-guessable storage names —
   see `tech.md` upload rules and `design.md` security table).
4. **Task 3.3:** server-rendered event page at `/[locale]/events/[slug]` with
   Open Graph + JSON-LD `Event` + directions + add-to-calendar + WhatsApp share.
   The organiser page's events stub can then link to real events.
5. **Task 3.4:** search, filters and the PostGIS map view.
