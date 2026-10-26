import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { formatEventDate } from "@/i18n/format";
import { getLocale, getMessages } from "@/i18n/messages";
import { requireUser } from "@/lib/auth";
import { listEventsInReview } from "@/lib/events";

import { EventReviewRow } from "./review-row";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.admin.events.title, robots: { index: false } };
}

async function ReviewQueue() {
  const [user, locale, t] = await Promise.all([
    requireUser(),
    getLocale(),
    getMessages(),
  ]);
  if (user.role !== "admin") notFound();

  const events = await listEventsInReview();
  const m = t.admin.events;

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {m.heading}
      </h1>
      <p className="mt-2 text-muted-foreground">{m.lead}</p>

      {events.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
          {m.empty}
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {events.map((event) => (
            <EventReviewRow
              key={event.id}
              locale={locale}
              event={{
                id: event.id,
                title: event.title,
                slug: event.slug,
                organiserName: event.organiserName,
                startsLabel: formatEventDate(event.startsAt, locale),
                where: `${event.venue}, ${event.district}, ${event.state}`,
              }}
              labels={{
                by: m.by,
                when: m.when,
                where: m.where,
                approve: m.approve,
                reject: m.reject,
                reasonLabel: m.reasonLabel,
                reasonPlaceholder: m.reasonPlaceholder,
                notAdmin: m.notAdmin,
                reasonRequired: m.reasonRequired,
                actionFailed: m.actionFailed,
                pleaseWait: t.common.pleaseWait,
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

export default async function AdminEventsPage() {
  const t = await getMessages();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <Suspense
          fallback={
            <p className="text-muted-foreground">{t.common.pleaseWait}</p>
          }
        >
          <ReviewQueue />
        </Suspense>
      </main>
    </>
  );
}
