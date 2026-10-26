import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";
import { requireUser } from "@/lib/auth";
import { listActiveCategories } from "@/lib/events";
import { getMyOrganiser } from "@/lib/organisers";

import { EventForm } from "./event-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return pageMetadata("/organiser/events/new", t.eventForm.title);
}

async function NewEventBody() {
  const [, locale, t, organiser, categories] = await Promise.all([
    requireUser(),
    getLocale(),
    getMessages(),
    getMyOrganiser(),
    listActiveCategories(),
  ]);

  // Only a verified organiser may create events. Others are sent to apply.
  if (organiser?.verification !== "verified") {
    redirect(localePath(locale, "/organiser/apply"));
  }

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {t.eventForm.heading}
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">{t.eventForm.lead}</p>
      <EventForm
        locale={locale}
        categories={categories.map((c) => ({
          value: c.slug,
          label: locale === "ms" ? c.nameMs : c.nameEn,
        }))}
        t={{
          messages: t.messages,
          form: t.eventForm,
          pleaseWait: t.common.pleaseWait,
        }}
      />
    </>
  );
}

export default async function NewEventPage() {
  const t = await getMessages();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <Suspense
          fallback={
            <p className="text-muted-foreground">{t.common.pleaseWait}</p>
          }
        >
          <NewEventBody />
        </Suspense>
      </main>
    </>
  );
}
