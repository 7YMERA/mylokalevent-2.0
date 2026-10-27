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

Last updated: 2026-10-27.

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
| #11 | Kiro's branch: Claude merged `main` in and fixed review findings 1–5 (commits below)      | Open, Kiro's PR      |
| #12 | This file                                                                                 | Open                 |
| #13 | `GOOGLE_SIGN_IN` flag: Google button hidden until the provider is set up                  | Open                 |
| #15 | Logo: wau bulan mark in the header, favicon, Apple touch icon, `docs/brand/`              | Open                 |

**Google sign-in is merged but parked (owner, 2026-10-26: "keep it at bay"
until there is time for the full setup).** PR #13 hides the button until
`GOOGLE_SIGN_IN=on`. When the owner is ready:

1. `npx supabase db push --linked` (applies `20261025130000_google_sign_in.sql`;
   without it the `/welcome` consent step fails).
2. Supabase → Authentication → Providers → Google: paste the Client ID and
   secret from Google Cloud (project "MyLokalEvent", client "MyLokalEvent web"),
   enable, save. If the secret was not kept, add a new secret on that client.
3. Google Auth Platform → Audience → add test users (the app is in Testing mode).
4. Set `GOOGLE_SIGN_IN=on` in `.env.local`, then try "Continue with Google" on
   localhost:3001.

**Hosting decision (owner, 2026-10-25):** Vercel runs the whole app (no Render
like v1); Supabase stays for the database and auth. The Vercel project is
connected but every build fails until these env vars exist in Vercel
(Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Then add the
`*.vercel.app` URL to Supabase redirect URLs and to the Google client's
JavaScript origins.

## Logo (2026-10-27)

The owner picked a **wau bulan** (moon kite) from four concepts (pin, bunga raya,
"M" app tile, wau), then asked for it tilted in flight with a string. Why a wau:
it is Malaysian and festive without being about fishing, so it still fits when
the app grows past fishing.

- `src/components/logo-mark.tsx` is the mark used in the header. Its colours are
  the `--logo-*` tokens in `globals.css` (light and dark), and the contrast
  test checks wing and tail against the background (3:1).
- `src/app/icon.svg` is the favicon. It follows the browser's light/dark setting
  through a media query inside the SVG, drops the thin spine, and thickens the
  string so it holds up at 16 px. It replaces the default `favicon.ico`.
- `src/app/apple-icon.png` (180 px) is the light mark on the sand background,
  rendered from `docs/brand/wau-light.svg`.
- `docs/brand/` has fixed-colour SVGs for light and dark backgrounds (README,
  social posts, slides) and a header preview.
- If you change the shape, change it in all four places: the component,
  `icon.svg` and both `docs/brand` SVGs share the same path data.

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

**Why CI showed nothing for 6 commits:** PR #11 had a **merge conflict with
`main`** (since #9 merged), and GitHub does not run `pull_request` CI on a
conflicted PR. **Resolved in `70ef4aa`** (merge commit, no history rewritten):
`database.types.ts` keeps both sides' functions; the CSP keeps both
`form-action` (from #9) and `frame-src` (from #11).

**Kiro: pull before you continue.** `git pull origin feat/organisers` brings in
the merge and the fixes below. If you have local commits, merge (don't rebase).

### Findings: fix before launch (ranked)

**Findings 1–5 are FIXED on `feat/organisers` (2026-10-26)**, owner said go:

| #   | Fix                                                                                                                                                                                                      | Commit    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Migration `20261026100000_review_guards.sql`: approved event content edit → `in_review`; no edits in `awaiting_payment`/`in_review`; verified organiser name/SSM edit → `pending`                        | `fe9855d` |
| 2   | Webhook deletes the `stripe_events` row when `confirm_payment` fails, so Stripe's retry is processed                                                                                                     | `5114e4e` |
| 3   | CSP `img-src` (and `connect-src`) allow `NEXT_PUBLIC_SUPABASE_URL`; `form-action` also allows `checkout.stripe.com` (a Server Action redirect to Stripe is a form-action navigation and was blocked too) | `70ef4aa` |
| 4   | Photos go browser → Storage (`uploads/<event_id>/`, signed upload URL) → server re-encodes to `events/<event_id>/*.webp` and deletes the original. New storage policy: owner reads own folder            | `0007e9a` |
| 5   | Events insert policy and `start_event_payment` require `is_verified_organiser`                                                                                                                           | `fe9855d` |

Verified locally: pgTAP **95/95** (new `review_guards_test.sql`, 13 checks;
5 of them fail on the old schema, so they test the fix), vitest 355, build,
lint, typecheck. **Not verified:** the photo upload against a real Supabase
Storage (no live project here). Test it once: create a draft with a 4–5 MB
geotagged JPEG, check it shows on the event page and has no GPS in EXIF.

**Product effect of fix 1 (owner can change this):** fixing a typo on a live
event hides it until an admin re-approves. If that's too strict, the trigger
can be limited to the date, venue and fee.

The original findings, for the record:

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

- **2026-10-27: header overflowed at 360 px after adding the logo** (26 px too
  wide, caught by a local check before pushing). Fix: under 380 px the header
  shows the mark only; the wordmark stays for screen readers (`sr-only`).
- **2026-10-26: CSP blocked the Stripe Checkout redirect** (found while
  resolving the merge, never hit at runtime). `form-action 'self'` also covers
  a Server Action's redirect. Fix: allow `https://checkout.stripe.com`.

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

1. **Fix findings 6–8 next** (price set by the caller, abandoned checkout
   trapping the event, webhook payment-status edge cases). Done: 1–5.
2. **A raw original can still be uploaded straight to `events/<id>/`** by an
   organiser using the API with their own token (the storage insert policy
   allows the whole event folder). Low risk (it's their own photo), but the
   `events/` prefix could be made server-only with the service key.
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

1. Owner: `npx supabase db push --linked` once PR #11 merges (new migrations),
   then Vercel env vars. Google is parked until the owner has time.
2. Claude or Kiro: findings 6–8 with tests (1–5 done).
3. Owner: real photo upload test (see fix 4 above).
4. Smoke test the money path with Stripe test keys (`stripe listen`).
5. PDPA export + account deletion (task 7.1), required for launch.
