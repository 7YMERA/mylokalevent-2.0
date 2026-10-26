# CLAUDE-NOTES — handoff from Claude (cloud) to Kiro / the owner

## Why this file exists (read first)

MyLokalEvent 2.0 is built by the owner (GitHub: 7YMERA) with two assistants:
**Kiro** on the owner's Windows laptop, and **Claude** in a cloud container that
only sees this repo. The repo is the only thing they share.
[`KIRO-NOTES.md`](KIRO-NOTES.md) is Kiro's baton; this file is Claude's, in the
same format. It says what Claude changed, what was proven vs only written, what
went wrong, what Claude could not do, and what Claude suggests next.

**If you are Kiro reading this:** the "Review of `feat/organisers`" section
below is written for you. Every finding has a file, the problem, and a
suggested fix.

**Standing rule for this file:** update it in the same PR as the work. Log every
error hit and its fix, every limitation, and every suggestion, newest first.

> Working notes, not product docs. Scope lives in `.kiro/specs/mvp/`. The
> portfolio before/after log lives in `docs/v1-vs-v2.md`.

Last updated: 2026-10-26.

## Where we are (Claude's side)

| PR  | What                                                                                      | State                |
| --- | ----------------------------------------------------------------------------------------- | -------------------- |
| #1  | README and `.gitignore`                                                                   | Merged               |
| #2  | Kiro steering files and MVP spec (`.kiro/specs/mvp/`)                                     | Merged               |
| #3  | Next.js 16 scaffold: env validation, security headers/CSP, CI (check, database, gitleaks) | Merged               |
| #4  | `profiles` table, roles, RLS, audit log, pgTAP tests                                      | Merged               |
| #5  | Design tokens (light + dark, contrast-tested), theme switcher, `docs/v1-vs-v2.md`         | Merged               |
| #6  | Email sign-up / sign-in / account with Supabase Auth (httpOnly cookies, `getClaims`)      | Merged               |
| #7  | Post-MVP backlog (`.kiro/specs/backlog.md`)                                               | Merged               |
| #8  | BM / EN: locale in the URL, browser detection, BM fallback, switcher, parity test         | Merged               |
| #9  | Google sign-in (PKCE) + privacy-consent step for new Google users                         | Merged (setup below) |
| #10 | `npm run demo:users`: demo member / organiser / admin accounts                            | Merged               |

**Google sign-in is merged but not switched on yet.** Still to do, by the owner:

1. `npx supabase db push --linked` (applies `20261025130000_google_sign_in.sql`;
   without it the `/welcome` consent step fails).
2. Supabase → Authentication → Providers → Google: paste the Client ID and
   secret from Google Cloud (project "MyLokalEvent", client "MyLokalEvent web"),
   enable, save. If the secret was not kept, add a new secret on that client.
3. Google Auth Platform → Audience → add test users (the app is in Testing mode).
4. Try "Continue with Google" on localhost:3001.

**Hosting decision (owner, 2026-10-25):** Vercel runs the whole app (no Render
like v1); Supabase stays for the database and auth. The Vercel project is
connected but every build fails until these env vars exist in Vercel
(Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Then add the
`*.vercel.app` URL to Supabase redirect URLs and to the Google client's
JavaScript origins.

## Review of `feat/organisers` (Kiro's tasks 2–6, PR #11), 2026-10-26

### What I verified (this closes most of Kiro's "verification gap")

Run on commit `237bfa7` in the cloud container (15 GB RAM, Linux):

| Check                                         | Result                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`, `typecheck`, `lint`, `format:check` | **Pass**                                                                                                                    |
| `npm test` (vitest)                           | **Pass**, 349 tests (incl. `contrast.test.ts`, which Kiro saw fail only on Windows)                                         |
| `npm run build` (production)                  | **Pass**. Every new page prerenders (PPR) with Cache Components on                                                          |
| pgTAP, all 5 test files                       | **Pass, 75/75**: events 18, organisers 17, payments 13, profiles 17, saves/follows 10                                       |
| pgTAP merged with `main` (+ Google)           | **Pass, 82/82**. The never-run `event_coordinates` (PostGIS generated columns) and `saves_follows` migrations apply cleanly |

How: Postgres 16 + PostGIS 3 + pgTAP installed locally, with small stubs for
Supabase's `auth` and `storage` schemas (no Docker here either). The stubs are
close to Supabase but not identical, so CI's `supabase test db` is still the
final word.

**Why CI shows nothing for the last 6 commits:** PR #11 has a **merge conflict
with `main`** (since #9 merged), and GitHub does not run `pull_request` CI on a
conflicted PR. Conflicts are only in `next.config.ts` (CSP `form-action` from
#9 vs `frame-src` from #11: keep both lines) and
`src/lib/supabase/database.types.ts` (keep both: `accept_privacy_notice` and
the new tables/functions). Merge `main` into the branch, push, and CI runs.

### Findings: fix before launch (ranked)

1. **Approved events can be edited with no re-review.**
   `20261026050000_events.sql`, policy "events: owner edits own while active".
   An organiser can get approved, then change the title, description, venue,
   date or slug to anything, and it stays live. The same applies to a verified
   organiser editing their name / SSM number (`organisers` update policy).
   _Fix:_ only allow updates while `status in ('draft','rejected')`, or add a
   trigger that moves an approved event back to `in_review` when content
   columns change. For organisers, re-pend verification when `name` or
   `ssm_number` changes.

2. **A failed webhook loses the payment forever.**
   `src/app/api/stripe/webhook/route.ts` inserts the Stripe event id into
   `stripe_events` _before_ calling `confirm_payment`. If the confirm fails
   (500), Stripe retries, the retry hits the duplicate row, returns 200, and
   the event never moves to `in_review`.
   _Fix:_ record the event id only after a successful confirm, or delete it on
   failure. `confirm_payment` is already idempotent, so this is safe.

3. **Event photos will not display.** The CSP `img-src` is
   `'self' blob: data:`, but hero images are signed URLs on
   `https://<ref>.supabase.co/storage/...`. The browser blocks them.
   _Fix:_ add the Supabase URL to `img-src` (built from
   `NEXT_PUBLIC_SUPABASE_URL`, like `form-action` already is on `main`).

4. **Photo upload over 1 MB fails.** Server Actions cap the body at 1 MB by
   default, and the form allows 4 × 5 MB. Vercel also caps function request
   bodies at about 4.5 MB, so raising `serverActions.bodySizeLimit` alone will
   not work in production.
   _Fix:_ upload straight from the browser to Storage with a signed upload URL
   (`createSignedUploadUrl`), then have a server step re-encode with `sharp`
   (EXIF strip) from the stored original.

5. **Unverified organisers can create and pay for events through the API.**
   The insert policy checks `organiser_id = auth.uid()` but not verification
   (only the app checks). A rejected or pending organiser can call PostgREST
   directly. `start_event_payment` does not check it either.
   _Fix:_ add `public.is_verified_organiser(auth.uid())` to the events insert
   policy and to `start_event_payment`.

6. **Price and featured days come from the caller.**
   `start_event_payment` is granted to `authenticated` and trusts the `amount`
   and `featured_days` it is given. A user can call it directly with
   `featured_days => 365`. Today the session id is not reusable, so this is
   hard to exploit, but it is one step away from being money-relevant.
   _Fix:_ compute amount and days inside the function from the purpose
   (constants or a `prices` table), or grant it to the service role only. In
   the webhook, also check `session.amount_total` against the stored amount.

7. **Abandoned checkout traps the event.** After "Submit & pay", the event is
   `awaiting_payment`. If the organiser closes Stripe, `submitEventForReview`
   only accepts `draft`/`rejected`, so they can never pay again.
   _Fix:_ allow `awaiting_payment` too (reuse or expire the old session), and
   handle `checkout.session.expired` to move it back to `draft`.

8. **Webhook payment-status edge cases.** `payment_status === undefined` is
   treated as paid (it should not be), and
   `checkout.session.async_payment_succeeded` is not handled (needed if a
   delayed method such as some bank transfers is ever enabled).

### Findings: smaller

- **Search breaks on commas.** `src/lib/events.ts` builds
  `query.or(\`title.ilike.${term},...\`)`from raw input, so`Marang, Terengganu`or a`)`breaks the filter (it cannot bypass`status = approved`, which is a
separate AND, plus RLS). _Fix:_ strip or escape `,()"` or quote the value.
- **Emails insert the event title as raw HTML** (`src/lib/email.ts`). The
  recipient is the organiser themselves, so the risk is low, but escape it.
- **"Free resubmit once" isn't implemented.** A rejected event pays again
  (`start_event_payment` accepts `rejected` for a new listing payment).
- **Admins can approve an event in any status**, including unpaid drafts.
  `set_event_status` could require `in_review` for `approved`/`rejected`.
- **WhatsApp preview has no image.** The OG metadata has no image, and a 1-hour
  signed URL would expire anyway. Use a generated OG image route
  (`opengraph-image.tsx`) or a public thumbnail bucket.
- **Organiser phone and SSM number are public** for verified organisers
  (whole-row select grant). Fine if intended ("contact organiser"), but say so
  in the privacy notice, or expose a view without `ssm_number`.

### What's good (keep doing it)

Every table has RLS with column grants, privileged changes go through audited
security-definer functions, `confirm_payment` is service-role-only and
idempotent, the webhook verifies signatures on the raw body, images are
re-encoded from their real bytes with EXIF stripped and stored privately, and
KIRO-NOTES is honest about what was not run. The tests for the new tables are
solid.

## Environment, limitations & things I could NOT do

### CI / error log (every failure hit + its fix)

Newest first.

- **2026-10-26: PR #11 shows no CI for its last 6 commits.** Cause: merge
  conflict with `main` (above). Not a code failure.
- **2026-10-25: Vercel preview builds fail.** Cause: no env vars in Vercel; the
  app's env check refuses to start. Fix: add the three vars (above).
- **2026-10-25: gitleaks failed on the auth e2e test.** A literal test password
  on a line containing "password". Fix: build test passwords from parts.
- **2026-10-25: gitleaks "invalid revision range"** after amending a merge
  commit. Only on the superseded head; the new head passed.
- **2026-10-25: `supabase db push` failed with `type user_role already exists`.**
  The reused Supabase project still held the v1 schema. The owner dropped the
  v1 tables, then pushed with `--linked`.
- **2026-10-25: Vitest could not resolve `@/`.** Fix: `vitest.config.ts` alias.
- **2026-10-25: locale cookie not set on client navigation** (prefetch skips
  the proxy). Fix: `LanguageSwitcher` also sets the cookie on click.
- **2026-10-25: mobile header overflowed.** Fix: compact one-button theme
  switcher on small screens.

### Limitations

- **Cloud container, not the owner's machine.** I see only this repo. I cannot
  run the app on the owner's laptop, see their `.env.local`, or open the
  Supabase / Vercel / Google dashboards unless the owner connects Chrome.
- **I never type secrets into forms** (client secrets, API keys, passwords),
  even with the browser connected. The owner pastes those.
- **The container is temporary.** Anything not pushed is lost, so every change
  goes through a branch and PR.
- **No Docker.** pgTAP runs on a local Postgres with `auth` / `storage` stubs;
  CI's `supabase test db` is the real check.
- **Not tested end to end:** Google sign-in round trip (needs the provider
  configured), Stripe, Resend, and image upload against a live project.
- **More RAM than Kiro had (15 GB).** Full build and full test suites run fine
  here, so I can close Kiro's "not built / not DB-tested" gaps after each push.

## Suggestions

1. **Fix findings 1–5 before anyone pays.** They are small and I can do them in
   one PR on top of `feat/organisers`, with pgTAP tests for each.
2. **Merge `main` into `feat/organisers`** so CI runs again.
3. **Split future work into smaller PRs.** PR #11 is titled "task 2.1" but holds
   tasks 2–6 (56 files, +6.4k lines). Small PRs get real CI runs and reviews.
4. **Regenerate `database.types.ts`** from the linked project
   (`supabase gen types typescript --linked`) to drop the hand-written casts.
5. **Turn on GitHub branch protection** that requires CI to pass, so a
   conflicted or red PR can't be merged by accident.
6. **Get Google sign-in live, then Vercel**, so the owner can test on a real URL
   and on a phone.
7. Keep `docs/v1-vs-v2.md` updated for tasks 2–6 (organiser page, event page,
   search, dashboard, admin queue). It has nothing past Google sign-in yet.

## Next steps (suggested order)

1. Owner: Google provider setup + `db push` (above), then Vercel env vars.
2. Merge `main` into `feat/organisers`; confirm CI green.
3. Claude or Kiro: security fixes 1–8 with tests.
4. Smoke test the money path with Stripe test keys (`stripe listen`).
5. PDPA export + account deletion (task 7.1), required for launch.
