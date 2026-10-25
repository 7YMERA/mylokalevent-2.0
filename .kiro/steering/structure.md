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
.env.example         every environment variable, with placeholder values
```

## Conventions
- One Kiro spec per feature in `.kiro/specs/<feature>/`.
- Database changes only through migrations in `supabase/migrations/`.
- Pull requests are small and focused; both Kiro and Claude work through PRs to `main`.
