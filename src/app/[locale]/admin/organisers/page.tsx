import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { getLocale, getMessages } from "@/i18n/messages";
import { requireUser } from "@/lib/auth";
import { listReviewableOrganisers } from "@/lib/organisers";

import { OrganiserReviewRow } from "./review-row";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.admin.organisers.title, robots: { index: false } };
}

async function ReviewQueue() {
  const [user, locale, t] = await Promise.all([
    requireUser(),
    getLocale(),
    getMessages(),
  ]);

  // Admin-only page. requireUser already sent anonymous visitors to sign-in;
  // a signed-in non-admin gets a 404 (no hint the page exists).
  if (user.role !== "admin") notFound();

  const organisers = await listReviewableOrganisers();
  const m = t.admin.organisers;

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {m.heading}
      </h1>
      <p className="mt-2 text-muted-foreground">{m.lead}</p>

      {organisers.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
          {m.empty}
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {organisers.map((organiser) => (
            <OrganiserReviewRow
              key={organiser.id}
              organiser={organiser}
              locale={locale}
              labels={{
                state: m.columnState,
                ssm: m.columnSsm,
                noSsm: m.noSsm,
                status: m.columnStatus,
                statusLabel: m.statuses[organiser.verification],
                approve: m.approve,
                reject: m.reject,
                reasonLabel: m.reasonLabel,
                reasonPlaceholder: m.reasonPlaceholder,
                reasonRequired: m.reasonRequired,
                notAdmin: m.notAdmin,
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

export default async function AdminOrganisersPage() {
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
