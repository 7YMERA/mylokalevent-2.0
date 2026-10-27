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

## After launch

- **AI-assisted listings.** An organiser uploads their event poster and the form fills
  itself, with each field coloured by how confident the model is. Nothing is published
  without the organiser checking it.
- **Faster organiser verification.** Cross-check uploaded registration documents
  against the application and show the result as a hint to the admin, who still decides.
- **A moderation team.** A moderator role and a shared review queue with round-robin
  assignment.
- **More event types.** The data model already supports any category beyond fishing.
- **More ways to earn.** Ticketing with a per-ticket fee, and subscriptions for frequent
  organisers.
