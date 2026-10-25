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

## How it's being built

Development is a joint effort between the author, working in Kiro, and Claude, working
through pull requests. Kiro specs in `.kiro/specs/` are the shared source of truth for
requirements, design and tasks.

## Copyright

This repository is public so the work can be seen, but no open source license is
granted. All rights reserved.
