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

Last updated: 2026-10-29 (design MCP servers in `.mcp.json`).

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
| #11 | Kiro's branch: Claude merged `main` in and fixed review findings 1–5 (commits below)      | Merged               |
| #12 | This file                                                                                 | Merged               |
| #13 | `GOOGLE_SIGN_IN` flag: Google button hidden until the provider is set up                  | Merged               |
| #14 | GitHub Action pushes Supabase migrations on merge; Vercel deploys from `main` only        | Merged               |
| #15 | Logo: wau bulan mark in the header, favicon, Apple touch icon, `docs/brand/`              | Merged               |
| #16 | Notes moved to `docs/notes/`; GitHub wiki set up with portfolio pages                     | Merged               |
| #17 | Launch page ("Apa itu MyLokalEvent?") on the homepage; built on #15 and #16               | Merged               |
| #18 | Fix: chosen light/dark theme kept when switching BM / EN                                  | Merged               |
| #20 | Pre-commit hook, `sharp` 0.35.5, Actions v6, README live link, payment fixes 6–8          | Merged               |
| #21 | Homepage becomes an open events feed; launch page moved to `/about`                       | Merged               |
| #22 | `.mcp.json`: shadcn, Magic UI, Playwright and Context7 MCP servers (no app or UI change)  | This PR              |

**Notes moved (2026-10-27):** `KIRO-NOTES.md` and `CLAUDE-NOTES.md` now live in
`docs/notes/` instead of the repo root. Kiro's steering file
`.kiro/steering/structure.md` says so, so Kiro picks up the new path. Polished
portfolio pages (project story, architecture, tech stack, roadmap) are on the
[GitHub wiki](https://github.com/7YMERA/mylokalevent-v2/wiki). Their source is
`docs/wiki/`, and `.github/workflows/wiki.yml` copies it to the wiki when it
changes on `main`, so wiki edits go through PRs too. Claude's cloud session
can't push to the wiki repo directly (the git proxy only allows the main repo),
which is why the workflow exists. Edit `docs/wiki/`, never the wiki web editor:
the next publish overwrites it. Keep the Roadmap page in step with
`.kiro/specs/mvp/tasks.md`.

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

## Design MCP servers (2026-10-29)

The owner asked for design MCP servers in the repo, with no UI change.

- **`.mcp.json` (repo root):** `shadcn` (`npx -y shadcn@latest mcp`), `magicui`
  (`npx -y @magicuidesign/mcp@latest`), `playwright`
  (`npx -y @playwright/mcp@latest --headless --isolated`) and `context7`
  (`npx -y @upstash/context7-mcp@latest`). No env vars or keys, so nothing secret
  in this public repo. README has a new "MCP servers for AI assistants" section on
  what each one is for.
- **Verified:** each command was started in the cloud container and answered an
  MCP `initialize` request (shadcn 1.0.0, Magic UI 1.0.4, Playwright 1.64 alpha,
  Context7 4.4.4). Not verified: loading them inside a Claude Code session on the
  owner's laptop (Claude Code asks to trust project servers on first use).
- **Limitations:** `shadcn` has little to work with until shadcn/ui is set up
  (no `components.json` yet). Kiro does not read `.mcp.json`; it uses
  `.kiro/settings/mcp.json`, so Kiro needs a copy of these entries to use them.
  `@latest` means versions can change between sessions; pin them if one breaks.
- **CI fix:** `main` failed `format:check` on `src/lib/events.ts` (two union
  types Prettier wants on separate lines, from #21). Reformatted here; no code
  change.
- **Suggestion:** anything taken from shadcn/ui or Magic UI should be restyled
  with our design tokens and contrast-checked in light and dark before it ships.

## Open events feed on the homepage (2026-10-28)

The owner changed direction from the launch page: the app should work like
social media. Anyone browses events and features without an account; liking,
commenting or adding posts asks for one at that moment. This PR is step 1 of 5
(feed → likes → comments → sign-in prompt + account menu → notes/screenshots).

- **Homepage (`/ms`, `/en`):** short hero (title, one-line lead, four feature
  pills, link to `/about`), then a feed of approved events that haven't ended
  yet, soonest first, max 30, from `listFeedEvents()` in `src/lib/events.ts`.
  Category chips are links (`?category=pond`), so they work without JS and
  can be shared. Unknown category slugs fall back to "all". The category filter
  uses an `!inner` join so it runs in the database before the limit.
- **Side card:** signed out → "Nak join sekali?" with sign up / sign in;
  signed in → "Hai, {name}!". It reads the session, so it sits in its own
  `<Suspense>`; the feed reads `searchParams`, so it has its own too.
- **Launch page:** moved unchanged to `src/app/[locale]/about/page.tsx`, with
  the page title "Apa itu MyLokalEvent?". Its roadmap list is still hard-coded
  there; keep it in step with `docs/wiki/Roadmap.md`.
- **Owner decisions (2026-10-28):** "+ Add" is reserved for member community
  posts (a later phase, now on the wiki roadmap). Adding events gets its own
  entry in the account menu under the name, top right ("Tambah acara" for
  organisers, "Jadi penganjur" for members)
  so one button never shows role-dependent options.
- **Copy:** new `feed.*` namespace plus `header.explore` / `header.about` in
  both message files. Parity test passes.
- **Verified:** lint, typecheck, 457 unit tests and `next build` pass.
  Screenshots taken with Playwright against `next start`, BM/EN, light/dark,
  1280 px and 390 px, no horizontal scroll.
- **Screenshot data:** the live database has **no events yet**, so the shots
  were taken against a small local mock of the Supabase REST API serving four
  sample events (not committed; nothing was written to the real database).
  On the live site the feed shows its empty state until organisers publish.
- **Not done yet (next PRs):** likes, comments, the "sign in to continue"
  sheet, and the account menu under the name.

## Theme kept when switching language (2026-10-27)

The owner reported that switching between `/ms` and `/en` reset the colour
theme to "match device". Reproduced on the live site with Playwright: after
picking Dark, a language switch left `data-theme` missing from `<html>` while
the `theme=dark` cookie was still there, so a reload brought Dark back.

- **Cause:** `src/app/[locale]/layout.tsx` is the root layout, and its
  `locale` param changes on a language switch, so React remounts it. React
  clears the attributes on `<html>` when it does, and `ThemeScript` (the
  inline script in `<head>`) only runs on a full page load, so nothing put
  `data-theme` back.
- **Fix:** `ThemeSync` in `src/components/theme-switcher.tsx`, rendered at the
  top of `<body>`. On each layout mount it reads the `theme` cookie in a layout
  effect (before paint, so no flash) and applies it through `setTheme`, which
  also tells the switcher to show the right option. `ThemeScript` stays for the
  first paint of a full load.
- **Verified:** lint, typecheck and 429 unit tests pass. Playwright against
  `next dev`, `/ms` → `/en` → `/ms` → reload: Dark picked on a light-mode
  device stays Dark, Light picked on a dark-mode device stays Light, and
  "match device" stays on the device setting. The switcher shows the right
  option after each switch. No colour tokens changed, so the contrast test
  still covers both themes.
- **Local dev gotcha:** `next dev` and `next build` refuse to start with the
  `.env.example` placeholders (`your-...`). For UI checks without Supabase,
  any non-placeholder URL and key in `.env.local` will do.
- **Watch for:** the same remount happens on any navigation that changes a root
  param. Anything else that sets attributes on `<html>` from client code needs
  the same treatment.

## Launch page (2026-10-27)

The owner asked for a "what is MyLokalEvent" marketing page like the TaskMatch
v2 landing page, and chose to make it **the homepage** (`/ms`, `/en`) rather
than a separate About page. Event browsing stays at `/events`.

- **Sections, in order:** hero (pitch, _Cari acara_ / _Senaraikan acara_, two
  sample event cards, logo chip), _Untuk siapa_, _Cara guna_ (3 steps for
  visitors, 3 for organisers), _Kenapa MyLokalEvent_ (6 features), _Mula dengan
  memancing_ (category tiles + "next" event types), _Apa yang baru_ (roadmap),
  CTA band. Anchor ids are language-neutral: `#audience`, `#how`, `#why`,
  `#roadmap`.
- **Header:** `SiteHeader` takes an optional `links` prop for in-page anchors,
  shown at `lg` and up. Other pages pass nothing and look the same as before.
- **Copy:** all strings are under `home.*` in `src/messages/{ms,en}.json`.
  Lists are objects keyed `"1"`, `"2"`, `"3"` (not arrays) so the BM/EN parity
  test's `flatten` and the JSON types keep working; the page reads them with
  `Object.values`. Removed keys: `home.browse`, `home.upcoming`.
- **Keep the roadmap honest:** the _Apa yang baru_ list is hard-coded in
  `src/app/[locale]/page.tsx` (`roadmap`). When reminders ship or poster import
  starts, move the item's status there and in `docs/wiki/Roadmap.md`.
- **Colours:** only existing tokens and pairs the contrast test already
  covers. The logo sits on a `bg-surface` chip because the teal wing on the
  teal hero gradient is below 3:1.
- **Verified:** lint, typecheck and 429 unit tests pass. Screenshots taken
  with Playwright against `next dev` (light/dark, desktop/mobile, BM/EN), no
  horizontal scroll at 390 px. They replace the v2 home shots in
  `docs/v1-vs-v2.md`, still compared against v1.
- **Not done:** the sample event cards are still static. Swap them for the
  latest approved events once there are real listings.

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

**Findings 6–8 are FIXED (2026-10-27)** in migration
`20261027100000_payment_fixes.sql` and the webhook:

- **6:** `payment_price(purpose)` holds the prices (RM10 listing, RM20 for 7
  featured days; `src/lib/pricing.ts` must match). `start_event_payment` now
  takes `(event, session, purpose)`, sets the amount itself and returns it.
  `confirm_payment(session, amount_total, currency)` refuses a charge that
  isn't the stored amount in MYR: the payment becomes `failed`, the mismatch is
  audited, the event doesn't move, and the webhook answers 200 (a retry
  wouldn't help; an admin refunds).
- **7:** a listing can be paid again from `awaiting_payment` ("Continue
  payment" on the dashboard). The server action expires the earlier open
  Stripe session first, and refuses if one is already complete but not yet
  confirmed (`paymentProcessing`), so nobody pays twice. `expire_payment`,
  called on `checkout.session.expired` and `async_payment_failed`, marks the
  payment failed and sends the event back to `draft`.
- **8:** only `payment_status === "paid"` is confirmed on
  `checkout.session.completed`; `async_payment_succeeded` confirms delayed
  methods.

Verified with `supabase test db` in Docker (111/111; `payments_test.sql` now
has 29 checks), plus lint, typecheck, vitest and build. **Not verified:** a real
Stripe round trip. Add `checkout.session.expired`,
`checkout.session.async_payment_succeeded` and
`checkout.session.async_payment_failed` to the webhook endpoint's events in the
Stripe dashboard.

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

- **2026-10-27: PR #19 (Kiro, `docs/wiki-roadmap`) failed `format:check`.**
  Prettier wanted a blank line after each `### Phase N` heading in
  `docs/wiki/Roadmap.md`; the owner got failed-run emails. Fix: formatted the
  file on that branch (`b676cd9`). Prevention: `npm install` now sets up a
  Husky pre-commit hook that runs `lint-staged` (Prettier on staged files), and
  `.kiro/steering/tech.md` says so. Same PR: `sharp` 0.34.4 → 0.35.5 (high
  `npm audit` advisory in libvips/libheif/librsvg; checked that rotate, resize,
  WebP and EXIF stripping still work) and `actions/checkout`/`setup-node` v4 →
  v6 (v4 ran on the deprecated Node 20).
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

1. ~~Fix findings 6–8~~ Done (2026-10-27), as were 1–5. Next: smoke-test
   the money path with Stripe test keys.
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
2. ~~Findings 6–8 with tests~~ Done (2026-10-27).
3. Owner: real photo upload test (see fix 4 above).
4. Smoke test the money path with Stripe test keys (`stripe listen`).
5. PDPA export + account deletion (task 7.1), required for launch.
