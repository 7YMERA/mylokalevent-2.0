import type { Metadata } from "next";

import { CategoryBadge, type Category } from "@/components/category-badge";
import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Design system · MyLokalEvent",
  robots: { index: false },
};

const swatches = [
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["surface-muted", "bg-surface-muted"],
  ["foreground", "bg-foreground"],
  ["muted-foreground", "bg-muted-foreground"],
  ["border", "bg-border"],
  ["primary", "bg-primary"],
  ["accent", "bg-accent"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
] as const;

const categories: Category[] = ["competition", "market", "pond", "community"];

function Preview({ theme }: { theme: "light" | "dark" }) {
  return (
    <section
      data-theme={theme}
      className="flex flex-col gap-8 rounded-3xl border border-border p-6 sm:p-8"
    >
      <h2 className="font-display text-xl font-bold capitalize">
        {theme} theme
      </h2>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">Colour</h3>
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {swatches.map(([name, className]) => (
            <li key={name} className="text-xs">
              <div
                className={`h-12 rounded-lg border border-border ${className}`}
              />
              <p className="mt-1 font-mono">{name}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">
          Typography
        </h3>
        <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">
          Bricolage Grotesque for headings
        </p>
        <p className="mt-2">
          Geist for body text, sized for comfortable reading on phones.
        </p>
        <p className="mt-1 text-muted-foreground">
          Muted text for secondary details, still at least 4.5:1 contrast.
        </p>
        <a href="#" className="mt-1 inline-block text-primary underline">
          A text link
        </a>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Primary action
        </button>
        <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground">
          Highlight
        </button>
        <button className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold">
          Secondary
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <CategoryBadge key={category} category={category} />
        ))}
        <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
          Approved
        </span>
        <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
          In review
        </span>
        <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
          Rejected
        </span>
      </div>

      <div className="max-w-xs">
        <EventCard
          event={{
            title: "Pertandingan Memancing Pantai Batu Burok",
            category: "competition",
            date: "Sat, 14 Mar 2027 · 7:00 am",
            place: "Kuala Terengganu, Terengganu",
            fee: "RM 50",
            organiser: "Kelab Pemancing Ganu",
            verified: true,
          }}
        />
      </div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Design system
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every colour is a token with a light and a dark value. Automated tests
          check that each text and background pair meets WCAG AA contrast in
          both themes.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Preview theme="light" />
          <Preview theme="dark" />
        </div>
      </main>
    </>
  );
}
