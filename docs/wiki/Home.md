<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/wau-dark.svg">
    <img src="images/wau-light.svg" alt="MyLokalEvent logo, a wau bulan kite" width="96">
  </picture>
</p>

<h1 align="center">MyLokalEvent</h1>

<p align="center"><b>Find, promote and run local events in Malaysia.</b><br>
Bahasa Melayu and English · light and dark mode · built mobile first</p>

![MyLokalEvent home page, light mode](https://raw.githubusercontent.com/7YMERA/mylokalevent-v2/main/docs/screenshots/v2/home-light-desktop.png)

## What it is

MyLokalEvent started as a university Enterprise Systems project. Version 2 rebuilds it
from scratch as a real product that Malaysians can use and that can earn money: a place
where clubs, co-ops, pond operators and small businesses post events, and where anyone
can find what's on near them.

It launches with **fishing and coastal community events** (fishing competitions, pasar
basah, fresh-catch listings, kolam pancing) in Terengganu, Kelantan and Sabah. Every
listing is a general event with a category, so other kinds of local events can be added
without changing the database.

## Who it's for

| Visitors                          | Members                                   | Organisers                                        | Admins                                       |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| Browse and search with no account | Save events, follow organisers, reminders | Post and manage events, get verified (SSM number) | Review events and organisers, handle reports |

## Highlights

- **Malaysian first.** Every page in BM and English, with the language in the URL so a
  link shared on WhatsApp opens in the sender's language. Prices in MYR.
- **Secure by design.** Row Level Security on every table, httpOnly cookie sessions,
  a strict Content Security Policy, and no secrets or demo passwords in the public repo.
- **A real design system.** Token-based colours with a light and a dark value each, and a
  test that fails the build if any text drops below WCAG AA contrast in either theme.
- **Shareable.** Event pages are server-rendered with Open Graph and structured data, so
  they look right in WhatsApp and search results.
- **Quality gates.** Every pull request runs lint, formatting, typecheck, unit tests,
  database (pgTAP) tests, a production build and secret scanning.

## Read more

- [[The v1 vs v2 story|v1-vs-v2-story]]: what changed from the university version, with screenshots
- [[Architecture]]: how the pieces fit, the data model and the key flows
- [[Tech stack|Tech-stack]]: what it's built with and why
- [[Roadmap]]: what's done, what's next, and ideas after launch

## How it's built

MyLokalEvent 2.0 is built by [@7YMERA](https://github.com/7YMERA/mylokalevent-v2) with two AI pair programmers: Kiro on a
laptop and Claude in the cloud, both working through pull requests. Specs written before
the code live in [`.kiro/specs/`](https://github.com/7YMERA/mylokalevent-v2/tree/main/.kiro/specs), and each assistant keeps a
handoff log in [`docs/notes/`](https://github.com/7YMERA/mylokalevent-v2/tree/main/docs/notes).

The source is public so the work can be seen. No open source license is granted; all
rights reserved.
