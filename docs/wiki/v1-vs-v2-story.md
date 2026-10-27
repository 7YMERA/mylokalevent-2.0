# The v1 vs v2 story

Version 1 was built for a university course: a FastAPI backend, Supabase as a database,
and a vanilla JavaScript single-page app on Bootstrap. It worked as a demo. Version 2 asks
a different question: what would it take for real organisers and real members to trust it
with their events, their data and their money?

The full, always-current log with every screenshot is in
[`docs/v1-vs-v2.md`](https://github.com/7YMERA/mylokalevent-v2/blob/main/docs/v1-vs-v2.md). This page tells the story.

## Side by side

| v1                                                                                                             | v2 light                                                                                                                    | v2 dark                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| ![v1 home](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v1/home-desktop.png) | ![v2 home, light](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/home-light-desktop.png) | ![v2 home, dark](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/home-dark-desktop.png) |

| v1 mobile                                                                                                       | v2 mobile, BM                                                                                                                | v2 mobile, English, dark                                                                                                      |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ![v1 mobile](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v1/home-mobile.png) | ![v2 mobile, BM](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/home-ms-light-mobile.png) | ![v2 mobile, dark](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/home-en-dark-mobile.png) |

## 1. Security came first

A review of v1 found the kind of problems that are fine in a classroom and serious in
production:

| v1                                                                       | v2                                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Login tokens in `localStorage`, readable by any injected script          | Supabase Auth sessions in httpOnly cookies that JavaScript can't read               |
| Tokens kept working for an hour after a user was banned                  | Suspending a user signs them out of every session immediately                       |
| Backend used the all-powerful service key for every query                | Row Level Security on every table, covered by pgTAP tests in CI                     |
| Default `change-me` secret; admin and demo passwords in the public repo  | The app refuses to start with missing or placeholder secrets; no seeded accounts    |
| A credit wallet that could be double-spent; an unsigned payment fallback | Payments marked paid only by a signed, idempotent Stripe webhook in one transaction |
| No security headers                                                      | CSP, HSTS, `nosniff`, frame blocking, referrer and permissions policies             |

## 2. It looks like a product

v1 used Bootstrap defaults and one blue for nearly everything. v2 has its own design
system: deep sea teal, sunset coral and warm sand neutrals, a distinct colour for each
event category, and a wau bulan logo. Every colour token has a light and a dark value,
and a test checks 60 text and background pairs against WCAG AA in both themes, so text
can never vanish when you switch theme.

![v2 design system](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/design-system.png)

## 3. It speaks the user's language

v1 was English only, while much of its audience reads BM first. v2 opens in the visitor's
language (BM unless the browser prefers English), has a switcher on every page, and puts
the language in the URL so search engines index both and shared links open correctly.
A test fails the build if any translation is missing.

| v1 login                                                                                                         | v2 sign in                                                                                                         | v2 form errors, BM                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| ![v1 login](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v1/login-desktop.png) | ![v2 sign in](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/sign-in-light.png) | ![v2 errors in BM](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/sign-up-errors-ms.png) |

## 4. It's built like a team project

v1 was tested by hand. v2 has specs written before the code (requirements in EARS
format, a design and a task list), small pull requests, and CI that runs lint,
formatting, typecheck, unit tests, database tests, a production build and secret
scanning on every one. Database migrations deploy automatically when they merge.

## Lessons from the rebuild

- Security is cheapest at the start. Putting the rules in the database (RLS and Postgres
  functions) means a bug in one page can't leak another user's data.
- Design tokens plus an automated contrast test end the "it looked fine in light mode"
  class of bug.
- Writing the spec first made it possible to split work between two AI assistants and
  one human without stepping on each other.
