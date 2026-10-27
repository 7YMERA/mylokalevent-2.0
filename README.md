# MyLokalEvent 2.0

A platform for discovering, promoting and running local events in Malaysia, built
properly this time: secure, reliable and ready for real users and real payments.

> **Status:** early planning. There is no working app in this repo yet.

## The goal

MyLokalEvent 2.0 is a passion project with room to grow. For now the aim is to:

- **Serve Malaysians first.** Built around local needs: Bahasa Melayu and English,
  Malaysian payment methods, and the events that bigger platforms overlook.
- **Be professional and grounded.** Real security, real data protection (PDPA),
  and a codebase that can be maintained, not a demo.
- **Earn its keep.** Generate income from the events it helps run, such as posting
  fees, ticketing or promotion, so it can sustain itself and grow.

The launch niche is **fishing and coastal community events**: fishing competitions,
coastal markets, fresh-catch listings and _kolam pancing_ spots, starting with states
like Terengganu, Kelantan and Sabah. The platform is designed so any other kind of
local event can be added later.

## How it started

MyLokalEvent began as a university project for TEB3323 Enterprise System Development:
a regional event and fishery marketplace connecting organisers, fishermen's co-ops,
advertisers and the public. It had event posting with admin approval, Stripe payments,
a credit wallet, ad campaigns, a community feed and analytics dashboards.

The original code lives at [7YMERA/mylokalevent](https://github.com/7YMERA/mylokalevent).
It proved the idea works, but it was built for a course, not for the public. 2.0 is a
fresh rebuild that keeps the idea and leaves the shortcuts behind.

## What's next

1. **Define 2.0.** Agree on who it serves, how it makes money and the first feature
   set, written up as Kiro specs in `.kiro/specs/`.
2. **Lay the foundation.** Choose the stack, set up authentication with database-level
   access rules, CI, and a security baseline from day one.
3. **Build the MVP.** Event discovery and event pages, verified organiser accounts,
   and payments or ticketing.
4. **Prepare for launch.** PDPA compliance, a security review, and a closed beta with
   a few real organisers.

Ideas further out: QR ticket check-in, map and "near me" discovery, an installable
mobile web app, WhatsApp sharing and reminders, organiser reviews, and expanding
beyond fishing to all kinds of local events.

## Running it locally

Requires Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev                  # http://localhost:3000
```

Before opening a pull request, run the same checks CI runs:

```bash
npm run lint && npm run format:check && npm run typecheck && npm test
```

Database migrations live in `supabase/migrations/` and their access-rule tests in
`supabase/tests/`. With Docker running:

```bash
npx supabase start      # local Supabase stack
npx supabase test db    # run the database tests
```

Migrations reach the hosted project automatically: when a pull request that
adds one is merged, the **Deploy database** workflow (`.github/workflows/deploy-db.yml`)
runs `supabase db push`. It needs three repository secrets (Settings → Secrets and
variables → Actions), and skips with a warning until they exist:

| Secret                  | Where to get it                                                 |
| ----------------------- | --------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens → Generate new token         |
| `SUPABASE_DB_PASSWORD`  | The database password (Project Settings → Database to reset it) |
| `SUPABASE_PROJECT_ID`   | The project ref, the `xxxx` in `https://xxxx.supabase.co`       |

To run it by hand (for example after adding the secrets), open Actions → Deploy
database → Run workflow. From a machine with the CLI, `npx supabase db push --linked`
does the same.

Google sign-in needs an OAuth client (Web application) in Google Cloud with the
redirect URI `https://<your-project-ref>.supabase.co/auth/v1/callback`, and its client
ID and secret entered under Authentication → Sign In / Providers → Google in Supabase.
The secret never goes in this repo. Then set `GOOGLE_SIGN_IN=on` in `.env.local` (and in
Vercel) to show the "Continue with Google" button; it stays hidden until then.

## Demo accounts

There are no seeded accounts with known passwords (v1 had them in the repo). To get
a member, an organiser and an admin to click around with, add `SUPABASE_SECRET_KEY`
to `.env.local` and run:

```bash
npm run demo:users              # create or reset; prints fresh passwords once
npm run demo:users -- --remove  # delete them again, e.g. before launch
```

## v1 vs v2

See [docs/v1-vs-v2.md](docs/v1-vs-v2.md) for side-by-side screenshots and a log of every
improvement over the original project.

## How it's being built

Development is a joint effort between the author, working in Kiro, and Claude, working
through pull requests. Kiro specs in `.kiro/specs/` are the shared source of truth for
requirements, design and tasks. Each assistant keeps a handoff log in
[`docs/notes/`](docs/notes/): what changed, what was verified, problems hit and
suggestions. The [wiki](https://github.com/7YMERA/mylokalevent-2.0/wiki) has the
project story, architecture and roadmap.

## Copyright

This repository is public so the work can be seen, but no open source license is
granted. All rights reserved.
