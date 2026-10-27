# Roadmap

The live task list is [`.kiro/specs/mvp/tasks.md`](https://github.com/7YMERA/mylokalevent-v2/blob/main/.kiro/specs/mvp/tasks.md).
This page is a summary, last updated 27 October 2026.

## MVP

| Area                 | Status         | What's in it                                                                    |
| -------------------- | -------------- | ------------------------------------------------------------------------------- |
| Foundation           | ✅ Done        | Next.js scaffold, secret checks, Supabase Auth, BM/EN, CI, security headers     |
| Brand and design     | ✅ Done        | Design tokens, light and dark mode, contrast tests, wau bulan logo              |
| Organisers           | ✅ Done        | Apply to organise, public organiser page, admin verification with audit log     |
| Events               | ✅ Done        | Event form with photo upload, server-rendered event page, search and filters    |
| Payments             | 🟡 Built       | Listing fee and featured placement through Stripe; needs testing with live keys |
| Moderation and admin | 🟡 In progress | Review queue done; reports, suspensions and dashboards to come                  |
| Engagement           | 🟡 In progress | Save events and follow organisers done; reminders and notifications to come     |
| Launch readiness     | ⬜ Not started | PDPA data export and deletion, security review, end-to-end tests, closed beta   |

Google sign-in is built and switched off until its setup is finished. An interactive
multi-pin map is planned to replace the current embedded map.

## Before launch — hardening suggestions

These close out the MVP and come before any new features. Most are small.

- **Payments review.** The listing fee and featured purchase are built but have
  only been tested with stubs. Smoke-test the full money path with Stripe test
  keys (`stripe listen`), compute the price inside the database function (never
  trust the amount sent by the browser), and verify the webhook's
  `amount_total` against the stored amount.
- **Organiser privacy.** A verified organiser's phone and SSM number are
  currently readable by the public. Decide what is meant to be public, say so
  in the privacy notice, and hide the rest behind a view.
- **Share previews.** Give each event page a generated preview image so links
  look right when shared on WhatsApp and Facebook.
- **PDPA.** Data export and account deletion, plus a clear consent and privacy
  notice. This is required to launch to the public in Malaysia.
- **Interactive map.** Replace the embedded single-pin map with a real pan and
  zoom map showing every result as a pin.
- **Security review + closed beta.** A pass over the access rules, then a small
  group of real organisers in Terengganu, Kelantan and Sabah before opening up.

## After launch — phased roadmap

### Phase 1 — make organisers faster and events richer
- **AI-assisted listings.** An organiser uploads their event poster and the form
  fills itself, each field coloured by how confident the model is. Nothing is
  published without the organiser checking it.
- **Faster organiser verification.** Cross-check uploaded registration documents
  against the application and show the result as a hint to the admin, who still
  decides.
- **Reminders and notifications.** Notify members before a saved event starts,
  and when an organiser they follow posts something new.
- **Event updates.** Let an organiser post changes (new time, weather call-off)
  that reach everyone who saved the event.

### Phase 2 — ticketing and attendance
- **Ticketing.** Paid and free tickets with a per-ticket fee, capacity limits,
  and a waitlist.
- **QR check-in.** A scannable ticket and an organiser check-in screen for the
  day of the event.
- **Payouts.** Pay organisers their ticket revenue, minus the platform fee, on
  a schedule.

### Phase 3 — community and trust
- **A moderation team.** A moderator role and a shared review queue with
  round-robin assignment, so review does not depend on one admin.
- **Reviews and ratings.** Attendees rate an event afterwards; an organiser's
  track record shows on their page.
- **Reports and safety.** Let anyone report an event or organiser, with a queue
  and an audit trail for every decision.

### Phase 4 — reach and retention
- **Installable mobile web app.** Add-to-home-screen, offline event pages, and
  push notifications for reminders.
- **"Near me" discovery.** Sort and filter by distance using the map.
- **WhatsApp reminders.** Opt-in reminders over WhatsApp, where most of the
  audience already is.
- **Organiser subscriptions.** A monthly plan for frequent organisers instead of
  paying per listing.

## Expansion plans

- **Beyond fishing.** The data model already supports any category. Grow into
  night markets, runs and sports, festivals and concerts, and workshops —
  one state and one community at a time, the same way fishing started.
- **Beyond the east coast.** Start in Terengganu, Kelantan and Sabah, then
  expand state by state as organisers come on.
- **Sponsored placement.** Let local businesses sponsor a category or a region,
  clearly marked, as a second income stream beside listing and ticket fees.
- **Partnerships.** Work with fishing clubs, co-ops and tourism bodies so events
  land on the platform first.
- **Open data for councils.** A clean public feed of approved local events that
  a town or state tourism site can embed.

## How to keep this page honest

The MVP table above should match
[`.kiro/specs/mvp/tasks.md`](https://github.com/7YMERA/mylokalevent-v2/blob/main/.kiro/specs/mvp/tasks.md).
When a feature ships, move it up (for example reminders from Phase 1 into
Engagement). This is the vision, not a promise of order or dates — it changes as
real organisers tell us what they need.
