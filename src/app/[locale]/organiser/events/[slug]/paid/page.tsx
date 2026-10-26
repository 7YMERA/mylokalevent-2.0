import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.paid.title, robots: { index: false } };
}

// Post-payment confirmation page; always dynamic (renders the locale-aware
// header and is only reached after a Stripe redirect).
export const instant = false;

export default async function EventPaidPage() {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <div className="rounded-3xl border border-success/30 bg-success-soft p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-success">
            {t.paid.heading}
          </h1>
          <p className="mt-3 text-foreground">{t.paid.body}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t.paid.note}</p>
        </div>
        <Link
          href={localePath(locale, "/organiser")}
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {t.paid.backToDashboard}
        </Link>
      </main>
    </>
  );
}
