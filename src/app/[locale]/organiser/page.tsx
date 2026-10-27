import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { format, localePath } from "@/i18n/config";
import { formatEventDate } from "@/i18n/format";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";
import { requireUser } from "@/lib/auth";
import { listMyEvents } from "@/lib/events";
import { getMyOrganiser } from "@/lib/organisers";
import {
  LISTING_FEE_MYR,
  FEATURED_FEE_MYR,
  FEATURED_DAYS,
} from "@/lib/pricing";

import { FeaturedButton } from "./featured-button";
import { SubmitButton } from "./submit-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return pageMetadata("/organiser", t.dashboard.title);
}

const statusTone: Record<string, string> = {
  draft: "border-border bg-surface-muted text-muted-foreground",
  awaiting_payment: "border-warning/30 bg-warning-soft text-warning",
  in_review: "border-warning/30 bg-warning-soft text-warning",
  approved: "border-success/30 bg-success-soft text-success",
  rejected: "border-danger/40 bg-danger-soft text-danger",
  unpublished: "border-border bg-surface-muted text-muted-foreground",
};

async function Dashboard() {
  const [, locale, t, organiser] = await Promise.all([
    requireUser(),
    getLocale(),
    getMessages(),
    getMyOrganiser(),
  ]);

  if (organiser?.verification !== "verified") {
    redirect(localePath(locale, "/organiser/apply"));
  }

  const events = await listMyEvents();
  const d = t.dashboard;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {d.heading}
          </h1>
          <p className="mt-2 text-muted-foreground">{d.lead}</p>
        </div>
        <Link
          href={localePath(locale, "/organiser/events/new")}
          className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {d.newEvent}
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
          {d.empty}
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-3xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold tracking-tight">
                    {event.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {d.startsLabel}: {formatEventDate(event.startsAt, locale)}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusTone[event.status]}`}
                >
                  {d.statuses[event.status]}
                </span>
              </div>

              {event.status === "rejected" && event.rejectionReason ? (
                <p className="mt-3 text-sm text-danger">
                  {format(d.rejectedReason, { reason: event.rejectionReason })}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                {event.status === "approved" ? (
                  <>
                    <Link
                      href={localePath(locale, `/events/${event.slug}`)}
                      className="text-sm font-semibold text-primary underline"
                    >
                      {d.view}
                    </Link>
                    <FeaturedButton
                      eventId={event.id}
                      locale={locale}
                      label={format(d.buyFeatured, {
                        days: FEATURED_DAYS,
                        fee: FEATURED_FEE_MYR,
                      })}
                      pendingLabel={t.common.pleaseWait}
                      errorLabels={{
                        generic: t.messages.generic,
                        notOrganiser: t.messages.notOrganiser,
                        paymentsUnavailable: t.messages.paymentsUnavailable,
                      }}
                    />
                  </>
                ) : null}

                {event.status === "draft" ||
                event.status === "rejected" ||
                event.status === "awaiting_payment" ? (
                  <div>
                    <SubmitButton
                      eventId={event.id}
                      locale={locale}
                      label={
                        event.status === "awaiting_payment"
                          ? d.continuePayment
                          : d.submitForReview
                      }
                      pendingLabel={t.common.pleaseWait}
                      errorLabels={{
                        generic: t.messages.generic,
                        notOrganiser: t.messages.notOrganiser,
                        paymentsUnavailable: t.messages.paymentsUnavailable,
                        paymentProcessing: t.messages.paymentProcessing,
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(d.listingFeeNote, { fee: LISTING_FEE_MYR })}
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default async function OrganiserDashboardPage() {
  const t = await getMessages();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Suspense
          fallback={
            <p className="text-muted-foreground">{t.common.pleaseWait}</p>
          }
        >
          <Dashboard />
        </Suspense>
      </main>
    </>
  );
}
