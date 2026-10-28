import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CategoryBadge } from "@/components/category-badge";
import { SiteHeader } from "@/components/site-header";
import { format, localePath, type Locale } from "@/i18n/config";
import { formatEventDate } from "@/i18n/format";
import { getLocale, getMessages, type Messages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";
import { getCurrentUser } from "@/lib/auth";
import { listActiveCategories, listFeedEvents } from "@/lib/events";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/");
}

// The feed reads searchParams (category chips) and the DB, so it is dynamic.
export const instant = false;

type Search = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Stroke icons on a 24px grid, one per feature pill.
const featureIcons = {
  verified: "M9 12l2 2 4-4M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z",
  free: "M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z",
  share:
    "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  map: "M12 21s-6-5.7-6-11a6 6 0 1 1 12 0c0 5.3-6 11-6 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
} as const;

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-4"
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

async function Feed({
  searchParams,
  locale,
  t,
}: Search & { locale: Locale; t: Messages }) {
  const params = await searchParams;
  const raw = params.category;
  const categories = await listActiveCategories();
  const wanted = Array.isArray(raw) ? raw[0] : raw;
  // Ignore unknown slugs rather than showing an empty feed.
  const active = categories.some((c) => c.slug === wanted) ? wanted : undefined;
  const events = await listFeedEvents(active);
  const feed = t.feed;

  const chip = (selected: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface hover:bg-surface-muted"
    }`;

  return (
    <>
      <nav aria-label={feed.filterLabel} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 pb-1">
          <li>
            <Link
              href={localePath(locale)}
              aria-current={active ? undefined : "page"}
              className={chip(!active)}
            >
              {feed.all}
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`${localePath(locale)}?category=${c.slug}`}
                aria-current={active === c.slug ? "page" : undefined}
                className={chip(active === c.slug)}
              >
                {locale === "ms" ? c.nameMs : c.nameEn}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {events.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
          {active ? feed.empty : feed.emptyAll}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {events.map((event) => (
            <li key={event.slug}>
              <article className="relative rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <CategoryBadge category={event.categorySlug} />
                  <span className="whitespace-nowrap text-sm font-semibold">
                    {event.feeMyr === 0 ? t.common.free : `RM${event.feeMyr}`}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold leading-snug">
                  {/* Stretched link: the whole card opens the event. */}
                  <Link
                    href={localePath(locale, `/events/${event.slug}`)}
                    className="after:absolute after:inset-0 after:rounded-2xl"
                  >
                    {event.title}
                  </Link>
                </h3>
                {event.organiser && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(feed.by, { name: event.organiser.name })}
                  </p>
                )}
                <dl className="mt-4 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="sr-only">{t.common.date}</dt>
                    <dd>{formatEventDate(event.startsAt, locale)}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">{t.common.place}</dt>
                    <dd>
                      {event.venue}, {event.district}, {event.state}
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <div className="h-9 w-2/3 rounded-full bg-surface-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 rounded-2xl bg-surface-muted" />
      ))}
    </div>
  );
}

// Signed out: invite to join. Signed in: a short hello.
async function SideCard({ locale, t }: { locale: Locale; t: Messages }) {
  const user = await getCurrentUser();
  const feed = t.feed;

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold">{feed.join.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{feed.join.body}</p>
        <Link
          href={localePath(locale, "/sign-up")}
          className="mt-5 block rounded-full bg-primary px-5 py-2.5 text-center font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {feed.join.signUp}
        </Link>
        <Link
          href={localePath(locale, "/sign-in")}
          className="mt-3 block text-center text-sm font-semibold text-primary hover:underline"
        >
          {feed.join.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-bold">
        {format(feed.hello.title, { name: user.displayName })}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{feed.hello.body}</p>
      <Link
        href={localePath(locale, "/account")}
        className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
      >
        {feed.hello.account} →
      </Link>
    </div>
  );
}

export default async function Home({ searchParams }: Search) {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);
  const feed = t.feed;
  const features = Object.keys(featureIcons) as (keyof typeof featureIcons)[];

  return (
    <>
      <SiteHeader
        links={[
          { href: localePath(locale, "/events"), label: t.header.explore },
          { href: localePath(locale, "/about"), label: t.header.about },
        ]}
      />
      <main className="flex-1">
        {/* Short intro: what this is, in one glance, then straight to events. */}
        <section className="bg-gradient-to-br from-hero-from to-hero-to text-hero-foreground">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
            <h1 className="max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {feed.title}
            </h1>
            <p className="mt-3 max-w-xl text-lg opacity-90">{feed.lead}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="inline-flex items-center gap-1.5 rounded-full bg-hero-foreground/15 px-3 py-1 text-sm font-semibold"
                >
                  <Icon path={featureIcons[feature]} />
                  {feed.features[feature]}
                </li>
              ))}
            </ul>
            <Link
              href={localePath(locale, "/about")}
              className="mt-6 inline-block font-semibold underline underline-offset-4 hover:opacity-90"
            >
              {feed.about} →
            </Link>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-labelledby="feed-heading" className="min-w-0">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2
                id="feed-heading"
                className="font-display text-2xl font-bold tracking-tight"
              >
                {feed.heading}
              </h2>
              <Link
                href={localePath(locale, "/events")}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {feed.seeAll} →
              </Link>
            </div>
            <Suspense fallback={<FeedSkeleton />}>
              <Feed searchParams={searchParams} locale={locale} t={t} />
            </Suspense>
          </section>

          <aside className="grid content-start gap-4">
            <Suspense
              fallback={<div className="h-48 rounded-2xl bg-surface-muted" />}
            >
              <SideCard locale={locale} t={t} />
            </Suspense>
            <div className="rounded-2xl border border-border bg-surface-muted p-6">
              <h2 className="font-display text-lg font-bold">
                {feed.organiser.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {feed.organiser.body}
              </p>
              <Link
                href={localePath(locale, "/organiser/apply")}
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                {feed.organiser.cta} →
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        {t.common.footer}
      </footer>
    </>
  );
}
