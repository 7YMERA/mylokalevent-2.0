import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CategoryBadge } from "@/components/category-badge";
import { SiteHeader } from "@/components/site-header";
import { format, localePath } from "@/i18n/config";
import { formatEventDate } from "@/i18n/format";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";
import { listActiveCategories, searchApprovedEvents } from "@/lib/events";
import { MALAYSIAN_STATES } from "@/lib/geo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return pageMetadata("/events", t.search.title);
}

// Search is driven by searchParams + DB reads, so it is dynamic.
export const instant = false;

type Search = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function SearchBody({ searchParams }: Search) {
  const params = await searchParams;
  const [locale, t, categories] = await Promise.all([
    getLocale(),
    getMessages(),
    listActiveCategories(),
  ]);

  const keyword = one(params.q)?.trim() || undefined;
  const state = one(params.state) || undefined;
  const categorySlug = one(params.category) || undefined;
  const freeOnly = one(params.free) === "1";

  const results = await searchApprovedEvents({
    keyword,
    state,
    categorySlug,
    freeOnly,
  });
  const s = t.search;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {s.heading}
      </h1>

      {/* Plain GET form: works without JavaScript, shareable URL. */}
      <form
        method="get"
        className="mt-6 grid gap-4 rounded-3xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="text-sm font-semibold">{s.keyword}</span>
          <input
            name="q"
            defaultValue={keyword}
            placeholder={s.keywordPlaceholder}
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{s.state}</span>
          <select
            name="state"
            defaultValue={state ?? ""}
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-foreground"
          >
            <option value="">{s.anyState}</option>
            {MALAYSIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{s.category}</span>
          <select
            name="category"
            defaultValue={categorySlug ?? ""}
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-foreground"
          >
            <option value="">{s.anyCategory}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {locale === "ms" ? c.nameMs : c.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="free"
            value="1"
            defaultChecked={freeOnly}
            className="size-4 accent-primary"
          />
          {s.free}
        </label>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover lg:col-start-4"
        >
          {s.apply}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {format(s.resultsCount, { count: results.length })}
      </p>

      {results.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
          {s.noResults}
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((event) => (
            <li key={event.slug}>
              <Link
                href={localePath(locale, `/events/${event.slug}`)}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
              >
                <CategoryBadge category={event.categorySlug} />
                <h2 className="font-display text-lg font-semibold leading-snug">
                  {event.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatEventDate(event.startsAt, locale)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.venue}, {event.district}, {event.state}
                </p>
                <span className="mt-auto font-semibold">
                  {event.feeMyr === 0 ? t.common.free : `RM${event.feeMyr}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {s.mapTitle}
        </h2>
        {/* Interactive PostGIS map is deferred (needs a tile provider +
              client map lib). Until then, show a note. events.location is
              already stored, so the map can be dropped in here later. */}
        <p className="mt-4 rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
          {s.mapEmpty}
        </p>
      </section>
    </main>
  );
}

export default async function EventsSearchPage({ searchParams }: Search) {
  const t = await getMessages();
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
            <p className="text-muted-foreground">{t.common.pleaseWait}</p>
          </main>
        }
      >
        <SearchBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}
