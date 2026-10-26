# Post-MVP backlog

Ideas parked until the MVP ships. Each one becomes its own spec in `.kiro/specs/` when
we pick it up. Two rules apply throughout: AI and document checks only ever suggest,
and a person decides. They must also stay cheap enough to run as a side project.

## 1. AI-assisted event listing

An organiser uploads their event poster and the form fills itself in.

- A vision model reads the poster and returns title, date and time, venue, fee and
  contact, each with a confidence score. The form colours each field by confidence:
  green at 80% or more, orange at 50% or more, red below 50% (thresholds are tunable).
- Nothing is published from AI output alone. The organiser reviews and edits every
  field, and the event still goes through the normal draft and moderation flow.
- Models are not well calibrated, so confidence combines the model's own score with
  checks we run: the date parses and is in the future, the venue geocodes, the fee is
  a number.
- Provider-agnostic: one `extractEventFromImage()` interface in `src/lib/ai/` returning
  `{ field: { value, confidence } }`, validated with zod, with an adapter per provider
  (small, cheap vision models are enough). Record which model produced each draft.
- Treat poster text as untrusted input. Model output only fills form fields; it never
  triggers actions.
- Cost controls: runs only when the organiser clicks, a daily cap per organiser, images
  resized before sending, and results cached by image hash.

## 2. Organiser verification by cross-checking documents

Extends task 2.3 so admins see mismatches instead of reading every document by eye.

- The organiser uploads their SSM certificate and, if we need it, an IC or passport,
  to a private storage bucket.
- We extract the name and registration number and compare them with the application
  form and with each other. Each field gets a status: MATCH, MISMATCH or MISSING.
- Exact compare for registration numbers (after normalising the format). Fuzzy compare
  for names: case, spacing, "bin/binti" and word order, above a similarity threshold.
- Results are hints on the admin review screen. Admins approve or reject, never the
  system, and every decision goes to the audit log.
- PDPA: IC numbers are sensitive. Admin-only access, short-lived signed URLs, documents
  deleted a set number of days after the decision, and the privacy notice updated. First
  decide whether SSM alone (plus phone verification) is enough, so we never hold ICs.

## 3. Moderation queue with roles and round-robin assignment

For when more than one person moderates.

- Add a `moderator` role (reviews events and reports) alongside `admin` (verification,
  suspensions, payments, role changes). Enforce permissions in RLS and security-definer
  functions, not only in the UI.
- Event reviews, organiser verifications and reports share one queue. New items go to
  the available reviewer with the fewest open items, assigned inside a database
  function using `for update skip locked` so two items never race.
- Reviewers can mark themselves unavailable. Items untouched after a set time are
  reassigned, and admins can reassign by hand. Assignments are written to the audit log.
- Until there is a second moderator, keep a single shared queue.
