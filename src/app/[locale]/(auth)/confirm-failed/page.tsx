import type { Metadata } from "next";
import Link from "next/link";

import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.confirmFailed.title, robots: { index: false } };
}

export default async function ConfirmFailedPage() {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        {t.confirmFailed.heading}
      </h1>
      <p className="mt-2 text-muted-foreground">{t.confirmFailed.body}</p>
      <div className="mt-6 flex gap-3">
        <Link
          href={localePath(locale, "/sign-in")}
          className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {t.confirmFailed.signIn}
        </Link>
        <Link
          href={localePath(locale, "/sign-up")}
          className="rounded-full border border-border px-5 py-2.5 font-semibold"
        >
          {t.confirmFailed.signUp}
        </Link>
      </div>
    </>
  );
}
