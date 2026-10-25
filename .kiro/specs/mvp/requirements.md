# Requirements: MyLokalEvent 2.0 MVP

## Introduction
The MVP lets organisers in Malaysia publish fishing and coastal community events, lets
anyone discover them, and earns revenue from listing fees and featured placement. It
deliberately leaves out ticketing, the community feed and the ad network from v1; those
come after launch. Acceptance criteria use the EARS format.

## Requirement 1: Accounts and sign-in
**User story:** As a visitor, I want to create an account and sign in securely, so that
I can save events or publish my own.

1. WHEN a visitor signs up with email and password THEN the system SHALL send a
   verification email and SHALL NOT allow publishing until the email is verified.
2. WHEN a visitor signs up THEN the system SHALL show the privacy notice and record the
   user's consent with a timestamp.
3. The system SHALL support sign-in with Google as an alternative to email.
4. WHEN sign-in fails repeatedly from the same IP or for the same account THEN the
   system SHALL rate-limit further attempts without locking the account owner out
   permanently.
5. WHEN an admin suspends a user THEN the system SHALL end that user's sessions within
   one minute.
6. The system SHALL let a user change their password, download their data and delete
   their account.

## Requirement 2: Organiser profiles and verification
**User story:** As an organiser, I want a public profile with a verified badge, so that
people trust my events.

1. WHEN a member applies to become an organiser THEN the system SHALL collect a display
   name, contact phone, state and an optional SSM registration number.
2. WHEN an organiser submits an SSM number THEN the system SHALL mark them "pending
   verification" until an admin approves it.
3. WHILE an organiser is verified THE system SHALL show a verified badge on their
   profile and events.
4. Each organiser SHALL have a public profile page listing their upcoming and past events.

## Requirement 3: Publishing events
**User story:** As an organiser, I want to post an event with its details, so that
people can find and attend it.

1. WHEN an organiser creates an event THEN the system SHALL require a title, category,
   description, start and end date-time, state, district, venue and at least one image.
2. The system SHALL support optional fields: entry fee, prizes, registration link,
   contact WhatsApp number, map location and capacity.
3. The system SHALL store category as data, seeded with fishing competition, coastal
   market, kolam pancing session and community gathering, so admins can add categories
   without code changes.
4. WHEN an organiser submits an event THEN the system SHALL require payment of the
   listing fee before the event enters review.
5. WHEN an event is paid and submitted THEN its status SHALL become "in review" and an
   admin SHALL approve or reject it with a reason.
6. WHEN an event's end date passes THEN the system SHALL mark it as ended and keep it
   visible on the organiser's profile as a past event.
7. WHEN an organiser edits an approved event's title, dates or venue THEN the system
   SHALL notify members who saved it.

## Requirement 4: Discovering events
**User story:** As a visitor, I want to search and browse events near me, so that I can
find something to attend.

1. The home page SHALL show featured events, then upcoming events, without requiring
   sign-in.
2. The system SHALL let visitors filter by state, district, category, date range and
   free or paid, and search by keyword.
3. The system SHALL show events on a map and support "near me" using the browser's
   location only after the visitor allows it.
4. Each event SHALL have a server-rendered page with a stable, readable URL, Open Graph
   preview data for WhatsApp and social sharing, and structured data for search engines.
5. The event page SHALL show a "Get directions" link, "Add to calendar" and a WhatsApp
   share button.
6. The system SHALL show times in Malaysia time (UTC+8).

## Requirement 5: Saving, following and reminders
**User story:** As a member, I want to save events and follow organisers, so that I don't
miss anything.

1. WHEN a member saves an event THEN the system SHALL send a reminder email the day
   before it starts, unless the member turned reminders off.
2. WHEN a followed organiser publishes a new event THEN the system SHALL notify followers.

## Requirement 6: Payments
**User story:** As an organiser, I want to pay listing and featured fees with methods
common in Malaysia, so that paying is easy.

1. The system SHALL take payment through Stripe Checkout in MYR, supporting cards, FPX
   and GrabPay.
2. The system SHALL mark a payment as paid only after receiving a Stripe webhook with a
   valid signature.
3. WHEN the same webhook event is received more than once THEN the system SHALL process
   it only once.
4. WHEN a payment succeeds THEN the system SHALL email a receipt.
5. WHEN an admin rejects a paid event THEN the system SHALL refund the listing fee or let
   the organiser resubmit once without paying again (decide before build).
6. The system SHALL let an organiser buy featured placement for an approved event for a
   fixed number of days.

## Requirement 7: Moderation and admin
**User story:** As an admin, I want to review content and act on reports, so that the
platform stays trustworthy.

1. The admin area SHALL list events in review, organiser verification requests and
   open reports.
2. WHEN any user reports an event or organiser THEN the system SHALL record the reason
   and add it to the admin queue.
3. The system SHALL let admins suspend users, unpublish events and manage categories.
4. The system SHALL record every admin action in an append-only audit log.
5. The admin dashboard SHALL show revenue by month and events by state and category.

## Requirement 8: Language, accessibility and performance
1. The system SHALL be fully usable in Bahasa Melayu and English, with the language
   switchable on every page.
2. The system SHALL meet WCAG 2.1 AA for colour contrast, keyboard use and screen readers.
3. Public pages SHALL load their main content within 2.5 seconds on a mid-range phone
   over 4G.

## Requirement 9: Security and privacy
1. The system SHALL follow every rule in `.kiro/steering/tech.md` under "Security rules".
2. The system SHALL keep personal data in the Supabase Singapore region and document
   this in the privacy notice.
3. The system SHALL have a written breach response procedure before public launch.

## Out of scope for the MVP
Ticketing and QR check-in, the credit wallet, the community feed and comments, banner ad
campaigns, fresh-catch listings, fishing spot directory, native mobile apps.

## Open questions
- Listing fee amount (v1 used RM10) and featured placement pricing.
- Refund or free resubmission when an event is rejected (Requirement 6.5).
- Whether fresh-catch listings and the fishing spot directory return soon after launch,
  since they are part of what makes the fishing niche distinctive.
