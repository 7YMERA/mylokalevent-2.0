import type { Metadata } from "next";
import Link from "next/link";

import type { Category } from "@/components/category-badge";
import { EventCard, type EventPreview } from "@/components/event-card";
import { LogoMark } from "@/components/logo-mark";
import { SiteHeader } from "@/components/site-header";
import { format, localePath } from "@/i18n/config";
import { formatEventDate, formatTime } from "@/i18n/format";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/");
}

// Sample data for the hero preview until events come from the database.
// Times are UTC.
const sampleEvents = [
  {
    title: "Pertandingan Memancing Pantai Batu Burok",
    category: "competition",
    startsAt: "2027-03-13T23:00:00Z",
    place: "Kuala Terengganu, Terengganu",
    fee: "RM 50",
    organiser: "Kelab Pemancing Ganu",
    verified: true,
  },
  {
    title: "Pasar Nelayan Tok Bali",
    category: "market",
    startsAt: "2027-03-06T22:00:00Z",
    weekly: true,
    place: "Pasir Puteh, Kelantan",
    organiser: "Koperasi Nelayan Tok Bali",
    verified: true,
  },
] satisfies (Omit<EventPreview, "date" | "fee"> & {
  startsAt: string;
  weekly?: boolean;
  fee?: string;
})[];

const categoryTiles: { category: Category; style: string }[] = [
  {
    category: "competition",
    style: "bg-cat-competition-soft text-cat-competition",
  },
  { category: "market", style: "bg-cat-market-soft text-cat-market" },
  { category: "pond", style: "bg-cat-pond-soft text-cat-pond" },
  { category: "community", style: "bg-cat-community-soft text-cat-community" },
];

// Stroke icons on a 24px grid, one per feature.
const icons = {
  verified: "M9 12l2 2 4-4M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z",
  payments: "M3 7h18v10H3zM3 11h18M7 15h3",
  sharing:
    "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  bilingual:
    "M4 5h8M8 3v2M5 13c2.5-1.5 4.5-4.5 5-8M6 9c1 2 3 3.5 5 4M13 21l4-9 4 9M14.5 18h5",
  follow: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  directions:
    "M12 21s-6-5.7-6-11a6 6 0 1 1 12 0c0 5.3-6 11-6 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
} as const;

type Feature = keyof typeof icons;
const features = Object.keys(icons) as Feature[];

const roadmap = [
  ["verification", "shipped"],
  ["search", "shipped"],
  ["follow", "shipped"],
  ["reminders", "progress"],
  ["poster", "planned"],
  ["types", "planned"],
] as const;

const statusStyle = {
  shipped: "bg-success-soft text-success",
  progress: "bg-warning-soft text-warning",
  planned: "bg-surface-muted text-primary",
} as const;

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-4 text-lg text-muted-foreground">{lead}</p>}
    </div>
  );
}

export default async function Home() {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);
  const home = t.home;

  const events: EventPreview[] = sampleEvents.map(
    ({ startsAt, weekly, fee, ...event }) => ({
      ...event,
      date: weekly
        ? format(home.everySunday, { time: formatTime(startsAt, locale) })
        : formatEventDate(startsAt, locale),
      fee: fee ?? t.common.free,
    }),
  );

  const sections = ["audience", "how", "why", "roadmap"] as const;
  const audiences = ["visitors", "organisers"] as const;

  return (
    <>
      <SiteHeader
        links={sections.map((id) => ({
          href: `#${id}`,
          label: home.nav[id],
        }))}
      />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-hero-from to-hero-to text-hero-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {home.comingSoon}
              </p>
              <p className="mt-6 text-sm font-semibold uppercase tracking-widest opacity-90">
                {home.eyebrow}
              </p>
              <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                {home.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg opacity-90">{home.lead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={localePath(locale, "/events")}
                  className="rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground hover:opacity-90"
                >
                  {home.findEvents}
                </Link>
                <Link
                  href={localePath(locale, "/organiser/apply")}
                  className="rounded-full border border-hero-foreground/60 px-5 py-3 font-semibold hover:bg-hero-foreground/10"
                >
                  {home.listEvent}
                </Link>
              </div>
            </div>
            <div className="relative">
              {/* On a surface chip so the teal kite stays visible on the teal hero. */}
              <span className="absolute -top-8 right-0 grid size-16 rotate-6 place-items-center rounded-2xl bg-surface shadow-lg sm:size-20">
                <LogoMark className="size-12 sm:size-14" />
              </span>
              <p className="mb-3 text-sm font-semibold opacity-90">
                {home.sampleListings}
              </p>
              <div className="grid gap-4 text-foreground sm:grid-cols-2">
                {events.map((event) => (
                  <EventCard key={event.title} event={event} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section
          id="audience"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20"
        >
          <SectionHeading
            eyebrow={home.audience.eyebrow}
            title={home.audience.title}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {audiences.map((who) => {
              const card = home.audience[who];
              return (
                <div
                  key={who}
                  className="flex flex-col rounded-2xl border border-border bg-surface p-7"
                >
                  <h3 className="font-display text-xl font-bold">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">{card.body}</p>
                  <ul className="mt-5 grid gap-2">
                    {Object.values(card.points).map((point) => (
                      <li key={point} className="flex gap-2">
                        <span aria-hidden="true" className="text-primary">
                          ✓
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  {"cta" in card && (
                    <Link
                      href={localePath(locale, "/organiser/apply")}
                      className="mt-6 w-fit font-semibold text-primary hover:underline"
                    >
                      {card.cta} →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          className="scroll-mt-20 border-y border-border bg-surface-muted"
        >
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow={home.how.eyebrow} title={home.how.title} />
            <div className="mt-10 grid gap-12 md:grid-cols-2">
              {audiences.map((who) => (
                <div key={who}>
                  <h3 className="font-display text-lg font-bold">
                    {home.how[who].title}
                  </h3>
                  <ol className="mt-5 grid gap-5">
                    {Object.values(home.how[who].steps).map((step, i) => (
                      <li key={step.title} className="flex gap-4">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{step.title}</p>
                          <p className="text-muted-foreground">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why MyLokalEvent */}
        <section id="why" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <SectionHeading eyebrow={home.why.eyebrow} title={home.why.title} />
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <li key={feature} className="bg-surface p-7">
                <span className="grid size-10 place-items-center rounded-xl bg-surface-muted text-primary">
                  <Icon path={icons[feature]} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold">
                  {home.features[feature].title}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {home.features[feature].body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Fishing first, then every event type */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <SectionHeading
            eyebrow={home.growth.eyebrow}
            title={home.growth.title}
            lead={home.growth.lead}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTiles.map((tile) => (
              <li
                key={tile.category}
                className={`rounded-2xl p-5 ${tile.style}`}
              >
                <p className="font-display text-lg font-bold">
                  {t.categories[tile.category]}
                </p>
                <p className="mt-1 text-sm">{home.blurbs[tile.category]}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-muted-foreground">
              {home.growth.next}
            </span>
            {Object.values(home.growth.nextTypes).map((type) => (
              <span
                key={type}
                className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground"
              >
                {type}
              </span>
            ))}
          </div>
        </section>

        {/* What's new */}
        <section
          id="roadmap"
          className="scroll-mt-20 border-t border-border bg-surface-muted"
        >
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading
              eyebrow={home.roadmap.eyebrow}
              title={home.roadmap.title}
            />
            <ul className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {roadmap.map(([item, status]) => (
                <li
                  key={item}
                  className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:gap-6"
                >
                  <span
                    className={`w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:w-28 sm:text-center ${statusStyle[status]}`}
                  >
                    {home.roadmap.status[status]}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {home.roadmap.items[item].title}
                    </p>
                    <p className="text-muted-foreground">
                      {home.roadmap.items[item].body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Call to action */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-hero-from to-hero-to px-6 py-14 text-center text-hero-foreground">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {home.cta.title}
            </h2>
            <p className="mt-3 text-lg opacity-90">{home.cta.body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={localePath(locale, "/sign-up")}
                className="rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground hover:opacity-90"
              >
                {home.cta.signUp}
              </Link>
              <Link
                href={localePath(locale, "/events")}
                className="rounded-full border border-hero-foreground/60 px-5 py-3 font-semibold hover:bg-hero-foreground/10"
              >
                {home.findEvents}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        {t.common.footer}
      </footer>
    </>
  );
}
