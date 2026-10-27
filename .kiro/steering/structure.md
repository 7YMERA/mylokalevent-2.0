# Repository structure (target)

```
.kiro/
  steering/          product, tech and structure guidance for Kiro and Claude
  specs/             one folder per feature: requirements.md, design.md, tasks.md
src/
  app/[locale]/      Next.js routes, localised (ms, en); app/auth/ holds non-localised route handlers
  i18n/              locale config, message loading, date formatting
  components/        shared UI components
  lib/               Supabase clients, payments, email, validation
  messages/          translation files (ms.json, en.json); keep keys identical in both
supabase/
  migrations/        SQL migrations, including RLS policies and functions
  seed.sql           local development data only (no real accounts)
tests/               unit, RLS and end-to-end tests
docs/
  v1-vs-v2.md        portfolio before/after record and changelog
  screenshots/       v1 and v2 screenshots used by v1-vs-v2.md and the wiki
  notes/             handoff logs: KIRO-NOTES.md (Kiro) and CLAUDE-NOTES.md (Claude)
.env.example         every environment variable, with placeholder values
```

## Conventions
- Handoff notes live in `docs/notes/`: Kiro updates `docs/notes/KIRO-NOTES.md`, Claude updates `docs/notes/CLAUDE-NOTES.md`. Do not recreate them in the repo root.
- One Kiro spec per feature in `.kiro/specs/<feature>/`.
- Database changes only through migrations in `supabase/migrations/`.
- Pull requests are small and focused; both Kiro and Claude work through PRs to `main`.
