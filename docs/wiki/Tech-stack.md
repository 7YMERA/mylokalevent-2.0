# Tech stack

| Layer      | Choice                                            | Why                                                                              |
| ---------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19                 | Server rendering for speed, SEO and link previews; one codebase, no separate API |
| Language   | TypeScript, strict mode                           | Catches whole classes of bugs before they ship                                   |
| Styling    | Tailwind CSS 4 with design tokens                 | One source of truth for colour in light and dark mode                            |
| Validation | Zod                                               | The same schemas check form input on the server and type it                      |
| Database   | Supabase Postgres with Row Level Security         | Access rules enforced in the database, not just in page code                     |
| Auth       | Supabase Auth, httpOnly cookie sessions           | No tokens readable by JavaScript; email verification built in                    |
| Storage    | Supabase Storage, images processed with sharp     | Resize and strip location metadata before anything is public                     |
| Payments   | Stripe Checkout in MYR                            | Cards, FPX and e-wallets; confirmed only by signed webhooks                      |
| Email      | Resend                                            | Transactional email for receipts and review outcomes                             |
| i18n       | Built-in Next.js `[locale]` routes, JSON messages | BM and English with no extra library                                             |
| Hosting    | Vercel (app) and Supabase cloud (data)            | Deploys from `main`; managed Postgres in the region                              |
| Tests      | Vitest (unit), pgTAP (database rules)             | Logic and access rules both tested in CI                                         |
| CI         | GitHub Actions + gitleaks                         | Lint, format, typecheck, tests, build and secret scanning on every PR            |
| Planning   | Kiro specs (requirements, design, tasks)          | A shared plan for one developer and two AI assistants                            |

## Compared with v1

v1 used FastAPI, a vanilla JavaScript SPA, Bootstrap 5 and Supabase as a plain database
behind the service key, hosted on Render. v2 drops the separate API server: Next.js on
Vercel does the server work, and Supabase's Auth and Row Level Security replace the
hand-rolled login and permission checks.
