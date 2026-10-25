import type { Metadata } from "next";

import type { Category } from "@/components/category-badge";
import { EventCard, type EventPreview } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { format } from "@/i18n/config";
import { formatEventDate, formatTime } from "@/i18n/format";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/");
}

// Sample data until events come from the database. Times are UTC.
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
  {
    title: "Kolam Pancing Udang Galah Night Session",
    category: "pond",
    startsAt: "2027-03-05T12:00:00Z",
    place: "Kota Kinabalu, Sabah",
    fee: "RM 30",
    organiser: "Kolam Pancing Seri Gaya",
  },
  {
    title: "Gotong-Royong Pantai & Beach Clean-up",
    category: "community",
    startsAt: "2027-03-21T00:00:00Z",
    place: "Kuantan, Pahang",
    organiser: "Sahabat Laut Kuantan",
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

const features = ["verified", "payments", "sharing"] as const;

export default async function Home() {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);

  const events: EventPreview[] = sampleEvents.map(
    ({ startsAt, weekly, fee, ...event }) => ({
      ...event,
      date: weekly
        ? format(t.home.everySunday, { time: formatTime(startsAt, locale) })
        : formatEventDate(startsAt, locale),
      fee: fee ?? t.common.free,
    }),
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-hero-from to-hero-to text-hero-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <p className="text-sm font-semibold uppercase tracking-widest opacity-90">
              {t.home.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {t.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg opacity-90">{t.home.lead}</p>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              {t.home.comingSoon}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {t.home.browse}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTiles.map((tile) => (
              <li
                key={tile.category}
                className={`rounded-2xl p-5 ${tile.style}`}
              >
                <p className="font-display text-lg font-bold">
                  {t.categories[tile.category]}
                </p>
                <p className="mt-1 text-sm">{t.home.blurbs[tile.category]}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {t.home.upcoming}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.home.sampleListings}
            </p>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.title} event={event} />
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature}>
                <h3 className="font-display text-lg font-bold">
                  {t.home.features[feature].title}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {t.home.features[feature].body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        {t.common.footer}
      </footer>
    </>
  );
}
