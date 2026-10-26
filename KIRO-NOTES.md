# KIRO-NOTES — handoff for the next session (Claude / another device)

## Why this file exists (read first)

The product owner (GitHub: 7YMERA) is building MyLokalEvent 2.0 across **two
machines and two AI assistants** — Kiro (via the Kiro Crew agent layer) on one
device, and **Claude on another device** — using this public git repo as the
only sync between them. There is no shared chat history between the two: when the
owner switches device/assistant, the new assistant starts cold.

So this file is the **handoff baton**. Its job is to let Claude (or any next
session) **catch up in minutes instead of re-reading the whole codebase**: what's
done, what's half-done, which conventions to copy, what was verified vs only
written, and every environment limitation that shaped the work. The owner
explicitly asked for it to be kept current and honest for exactly this reason —
so coding can continue smoothly on the other device without repeating work or
re-discovering the same gotchas.

**If you are Claude reading this: update it when you finish a slice**, the same
way Kiro does — that keeps the baton good for the trip back.

> Working notes, not product docs. The source of truth for SCOPE is
> `.kiro/specs/mvp/` (requirements.md, design.md, tasks.md). This file says
> where we are and how this codebase actually works.

Last updated: 2026-10-26.

## Where we are

- **Task 1 (Foundation): DONE** — Next.js + TS, Supabase, `profiles` table + RLS,
  email auth with httpOnly cookies, i18n (ms/en), CI.
- **Task 2 (Organisers): DONE on branch `feat/organisers`.**
  - 2.1 DB layer — DONE. 2.2 public organiser page — DONE. 2.3 admin verify — DONE.
  - 2.1 apply-to-organise FORM — DONE (`/[locale]/organiser/apply`). A member
    applies; the row is created at `none`; the admin review page (2.3) verifies it.
- **Task 3 (Events): 3.1 + 3.2 + 3.3 DONE on branch `feat/organisers`.**
  - 3.1 `categories`/`events`/`event_images` tables, RLS, seed, status function — DONE.
  - 3.2 event form + safe image upload — DONE (`/[locale]/organiser/events/new`).
    Uploads are re-encoded server-side with `sharp` (strips EXIF/GPS), byte-type
    checked, size-capped (5 MB), stored in a PRIVATE `event-images` bucket under
    a random name; read back via short-lived signed URLs.
  - 3.3 public event page — DONE (`/[locale]/events/[slug]`). Server-rendered,
    Open Graph, JSON-LD `Event`, Google Maps directions, add-to-Google-Calendar,
    WhatsApp share.
  - 3.4 search, filters, map view — NOT STARTED. `events.location` is a PostGIS
    `geography(point)` ready for the map.
- **Tasks 4–7: NOT STARTED** (payments, moderation/admin, engagement, launch).

## Product decisions locked (confirm before building payments)

- Listing fee: **RM10**. Featured: **RM20 for 7 days**.
- Rejected after paying: **free resubmit once, no refund**.
- Fresh-catch listings + fishing-spot directory: **after launch**.

## What's in the Events slice (files to read)

DB (3.1):

- `supabase/migrations/20261026050000_events.sql` — enables PostGIS; `event_status`
  enum; `categories`, `events`, `event_images` tables with RLS; `set_event_status()`
  admin-only function (approve/reject/unpublish only, reason required to reject,
  audited); seeds the 4 launch categories.
- `supabase/migrations/20261026060000_event_images_storage.sql` — PRIVATE
  `event-images` storage bucket (5 MB cap, JPEG/PNG/WebP only) + storage RLS:
  an organiser writes/deletes within their own event's folder; no public read
  (reads use signed URLs). Path convention: `events/<event_id>/<random>.webp`.
- `supabase/tests/events_test.sql` — 18 pgTAP checks.
- `src/lib/supabase/database.types.ts` — extended with all three tables,
  `event_status`, and `set_event_status`.

App (3.2 event form + upload):

- `src/app/[locale]/organiser/events/new/{page,event-form,actions}.tsx|.ts` —
  verified-organiser-guarded create form; `actions.ts` validates, inserts the
  draft, and processes images (see `processImage`: byte-type check via `sharp`
  metadata, 5 MB cap, `.rotate().resize().webp()` which strips EXIF/GPS, random
  UUID filename, private-bucket upload).
- `src/lib/events.ts` — `getApprovedEvent`, `listActiveCategories`,
  `signedImageUrl` (1 h signed URLs for the private bucket).
- `src/lib/organiser-schemas.ts` — zod schemas (`applyOrganiserSchema`,
  `eventSchema`) with message-key errors.
- `src/lib/geo.ts` — fixed Malaysian states reference list.
- `src/components/form-field.tsx` — added `SelectField` + `TextareaField`.

App (3.3 public event page):

- `src/app/[locale]/events/[slug]/page.tsx` — server-rendered; OG metadata;
  JSON-LD `Event` (via `dangerouslySetInnerHTML` on a JSON.stringify of a
  server-built object — this is the SAFE use, NOT user HTML); Google Maps
  directions; add-to-Google-Calendar; WhatsApp share. Hero image via signed URL.

App (task 2.1 apply form):

- `src/app/[locale]/organiser/apply/{page,apply-form,actions}.tsx|.ts` — member
  applies; `getMyOrganiser()` (in `src/lib/organisers.ts`) shows an
  already-applied / already-verified state instead of the form.

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

| Thing                                               | Status                                                                                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 2.1 migration + 17 pgTAP tests                 | **Proven** — CI `database` job green on PR #11                                                                                                                              |
| Tasks 2.2 / 2.3 TypeScript                          | **Proven locally** — typecheck + eslint + translations test all green                                                                                                       |
| Task 2.1 apply form, 3.2 event form, 3.3 event page | **Proven locally** — typecheck + eslint + full vitest (226 pass) green. NOT yet exercised in a browser / against a live Supabase.                                           |
| Task 3.1 + 3.2 migrations (events + storage)        | **Written, NOT yet CI-run** — committed locally, not pushed. Mirror the proven 2.1 pattern. **Verify in CI after the next push.** No pgTAP test for the storage bucket yet. |
| Image upload pipeline (`sharp`)                     | **Written, NOT run** — the re-encode/EXIF-strip path has never executed (no Docker/local Supabase to upload against). Verify it with a real image + GPS EXIF once running.  |
| Full production build (`npm run build`)             | **Not run locally** (was RAM-limited earlier). CI covers it.                                                                                                                |

**New dependency this session:** `sharp@0.34.4` (pinned, exact) for server-side
image re-encoding. It has native binaries — `npm ci` on a new OS/arch pulls the
right ones, but if an install ever fails, that's why.

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
   the new events + storage migrations, not yet CI-run.
2. **Smoke-test the new flows against a live/local Supabase:** apply → admin
   verify → create event with a photo (check EXIF is gone) → approve → event page.
   None of this has run end-to-end yet.
3. **Organiser dashboard** (`/[locale]/organiser`): list my events + link to the
   create form and public pages. There's no landing page tying 2.1/3.2 together yet.
4. **Task 3.4:** search, filters and the PostGIS map view (home + `/events`).
5. **Task 4 (Payments):** the event form currently saves a draft only — there is
   NO submit-for-review + Stripe flow yet. `events.status` stays `draft` until the
   payment flow (design.md "Publishing an event") moves it to `in_review`.
