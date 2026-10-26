# Tasks: MyLokalEvent 2.0 MVP

Draft task list. Kiro can regenerate or refine this from `design.md`. Mark tasks done as
they merge, and note who is taking a task (Kiro or Claude) to avoid overlap.

- [ ] 1. Foundation
  - [x] 1.1 Scaffold Next.js (TypeScript strict, ESLint, Prettier, Tailwind; shadcn/ui added with the first real UI)
  - [x] 1.2 Add `.env.example` and a startup check that rejects missing or placeholder secrets
  - [x] 1.3 Set up Supabase locally with the CLI; first migration with `profiles` and RLS
  - [x] 1.4 Supabase Auth with httpOnly cookie sessions, email verification (Google sign-in still to do)
  - [x] 1.5 i18n with `ms` and `en`, locale switcher
  - [x] 1.6 CI: typecheck, lint, tests, secret scanning; security headers and CSP (baseline CSP; tighten later)
  - _Requirements: 1, 8, 9_
- [ ] 2. Organisers
  - [ ] 2.1 `organisers` table, RLS, apply-to-organise form (table + RLS DONE by Kiro; apply FORM still to do)
  - [x] 2.2 Public organiser profile page (Kiro, branch feat/organisers)
  - [x] 2.3 Admin verification flow with audit log (Kiro, branch feat/organisers)
  - _Requirements: 2, 7.4_
- [ ] 3. Events
  - [x] 3.1 `categories`, `events`, `event_images` tables with RLS and seed categories (Kiro, branch feat/organisers)
  - [ ] 3.2 Event form with draft saving and safe image upload
  - [ ] 3.3 Server-rendered event page with Open Graph, JSON-LD, directions, calendar, WhatsApp share
  - [ ] 3.4 Search, filters and map view
  - _Requirements: 3, 4_
- [ ] 4. Payments
  - [ ] 4.1 `payments` and `stripe_events` tables; `confirm_payment` function
  - [ ] 4.2 Stripe Checkout for listing fee; signed, idempotent webhook route
  - [ ] 4.3 Featured placement purchase; receipts by email
  - _Requirements: 6_
- [ ] 5. Moderation and admin
  - [ ] 5.1 Review queue with approve or reject and reason emails
  - [ ] 5.2 Reports, suspend user, unpublish event, manage categories
  - [ ] 5.3 Revenue and events dashboard; audit log viewer
  - _Requirements: 3.5, 7_
- [ ] 6. Engagement
  - [ ] 6.1 Save events and follow organisers
  - [ ] 6.2 Scheduled job: reminders, follower notifications, mark ended events
  - _Requirements: 3.6, 5_
- [ ] 7. Launch readiness
  - [ ] 7.1 Privacy notice, consent capture, data export and account deletion
  - [ ] 7.2 Breach response procedure; security review
  - [ ] 7.3 End-to-end tests for the main flows; closed beta with a few organisers
  - _Requirements: 1.6, 9_
