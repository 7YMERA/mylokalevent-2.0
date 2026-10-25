import { categoryLabels, type Category } from "@/components/category-badge";
import { EventCard, type EventPreview } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";

// Sample data until events come from the database.
const sampleEvents: EventPreview[] = [
  {
    title: "Pertandingan Memancing Pantai Batu Burok",
    category: "competition",
    date: "Sat, 14 Mar 2027 · 7:00 am",
    place: "Kuala Terengganu, Terengganu",
    fee: "RM 50",
    organiser: "Kelab Pemancing Ganu",
    verified: true,
  },
  {
    title: "Pasar Nelayan Tok Bali",
    category: "market",
    date: "Every Sunday · 6:00 am",
    place: "Pasir Puteh, Kelantan",
    fee: "Free",
    organiser: "Koperasi Nelayan Tok Bali",
    verified: true,
  },
  {
    title: "Kolam Pancing Udang Galah Night Session",
    category: "pond",
    date: "Fri, 6 Mar 2027 · 8:00 pm",
    place: "Kota Kinabalu, Sabah",
    fee: "RM 30",
    organiser: "Kolam Pancing Seri Gaya",
  },
  {
    title: "Gotong-Royong Pantai & Beach Clean-up",
    category: "community",
    date: "Sat, 21 Mar 2027 · 8:00 am",
    place: "Kuantan, Pahang",
    fee: "Free",
    organiser: "Sahabat Laut Kuantan",
  },
];

const categoryTiles: { category: Category; blurb: string; style: string }[] = [
  {
    category: "competition",
    blurb: "Shore, boat and kayak tournaments with prizes.",
    style: "bg-cat-competition-soft text-cat-competition",
  },
  {
    category: "market",
    blurb: "Fresh catch straight from the jetty.",
    style: "bg-cat-market-soft text-cat-market",
  },
  {
    category: "pond",
    blurb: "Ponds and sessions for a relaxed day out.",
    style: "bg-cat-pond-soft text-cat-pond",
  },
  {
    category: "community",
    blurb: "Clean-ups, festivals and gatherings.",
    style: "bg-cat-community-soft text-cat-community",
  },
];

const features = [
  {
    title: "Verified organisers",
    body: "Organisers can verify with their SSM registration, so you know who is behind each event.",
  },
  {
    title: "Pay the Malaysian way",
    body: "Listings paid by FPX online banking, cards or GrabPay, with instant receipts.",
  },
  {
    title: "Built for sharing",
    body: "Every event page previews nicely on WhatsApp, with directions and add-to-calendar.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-hero-from to-hero-to text-hero-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <p className="text-sm font-semibold uppercase tracking-widest opacity-90">
              Acara tempatan, dekat dengan anda
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Find fishing competitions, coastal markets and local events across
              Malaysia.
            </h1>
            <p className="mt-6 max-w-2xl text-lg opacity-90">
              Starting with Terengganu, Kelantan and Sabah. One place to
              discover what&apos;s on, and for organisers to reach the people
              who&apos;ll actually show up.
            </p>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              Coming soon
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Browse by category
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTiles.map((tile) => (
              <li
                key={tile.category}
                className={`rounded-2xl p-5 ${tile.style}`}
              >
                <p className="font-display text-lg font-bold">
                  {categoryLabels[tile.category]}
                </p>
                <p className="mt-1 text-sm">{tile.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Upcoming events
            </h2>
            <p className="text-sm text-muted-foreground">Sample listings</p>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sampleEvents.map((event) => (
              <EventCard key={event.title} event={event} />
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title}>
                <h3 className="font-display text-lg font-bold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        © 2026 MyLokalEvent. Made in Malaysia.
      </footer>
    </>
  );
}
