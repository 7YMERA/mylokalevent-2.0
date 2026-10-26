import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryBadge } from "@/components/category-badge";
import { SiteHeader } from "@/components/site-header";
import { formatEventDate } from "@/i18n/format";
import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { env } from "@/lib/env";
import { getApprovedEvent, signedImageUrl } from "@/lib/events";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [event, t] = await Promise.all([getApprovedEvent(slug), getMessages()]);
  if (!event) return { title: t.eventPage.notFound, robots: { index: false } };

  const description = event.description.slice(0, 200);
  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
    },
  };
}

// Builds a Google Maps directions URL from the venue text.
function directionsUrl(venue: string, district: string, state: string): string {
  const query = encodeURIComponent(`${venue}, ${district}, ${state}, Malaysia`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

// Google Calendar "add event" URL.
function calendarUrl(
  title: string,
  startsAt: string,
  endsAt: string | null,
  venue: string,
): string {
  const fmt = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const end =
    endsAt ??
    new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(startsAt)}/${fmt(end)}`,
    location: venue,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const [event, locale, t] = await Promise.all([
    getApprovedEvent(slug),
    getLocale(),
    getMessages(),
  ]);

  if (!event) notFound();

  const heroPath = event.imagePaths[0];
  const heroUrl = heroPath ? await signedImageUrl(heroPath) : null;

  const shareText = t.eventPage.shareText.replace("{title}", event.title);
  const eventUrl = `${env().NEXT_PUBLIC_SITE_URL}${localePath(locale, `/events/${event.slug}`)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${eventUrl}`)}`;

  const feeLabel = event.feeMyr === 0 ? t.common.free : `RM${event.feeMyr}`;

  // JSON-LD Event for rich search results. React escapes the JSON string.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    ...(event.endsAt && { endDate: event.endsAt }),
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.venue,
      address: `${event.venue}, ${event.district}, ${event.state}, Malaysia`,
    },
    ...(event.organiser && {
      organizer: { "@type": "Organization", name: event.organiser.name },
    }),
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className="mb-8 aspect-[16/9] w-full rounded-3xl border border-border object-cover"
          />
        ) : null}

        <CategoryBadge category={event.categorySlug} />
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {event.title}
        </h1>

        {event.organiser ? (
          <p className="mt-2 text-muted-foreground">
            {t.eventPage.by}{" "}
            <Link
              href={localePath(locale, `/o/${event.organiser.slug}`)}
              className="font-semibold text-primary underline"
            >
              {event.organiser.name}
            </Link>
          </p>
        ) : null}

        <dl className="mt-8 grid gap-4 rounded-3xl border border-border bg-surface p-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">
              {t.eventPage.when}
            </dt>
            <dd className="mt-1 font-semibold">
              {formatEventDate(event.startsAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {t.eventPage.where}
            </dt>
            <dd className="mt-1 font-semibold">
              {event.venue}, {event.district}, {event.state}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t.eventPage.fee}</dt>
            <dd className="mt-1 font-semibold">{feeLabel}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={directionsUrl(event.venue, event.district, event.state)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-muted"
          >
            {t.eventPage.directions}
          </a>
          <a
            href={calendarUrl(
              event.title,
              event.startsAt,
              event.endsAt,
              event.venue,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-muted"
          >
            {t.eventPage.addToCalendar}
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {t.eventPage.share}
          </a>
        </div>

        <div className="mt-10 whitespace-pre-line leading-relaxed">
          {event.description}
        </div>
      </main>
    </>
  );
}
