import type { Metadata } from "next";
import { Suspense } from "react";

import { signOut } from "@/app/[locale]/(auth)/actions";
import { SiteHeader } from "@/components/site-header";
import { format } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { requireUser } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.account.title, robots: { index: false } };
}

async function AccountDetails() {
  const [user, locale, t] = await Promise.all([
    requireUser(),
    getLocale(),
    getMessages(),
  ]);
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {format(t.account.greeting, { name: user.displayName })}
      </h1>
      <dl className="mt-8 grid gap-4 rounded-3xl border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">{t.account.email}</dt>
          <dd className="mt-1 font-semibold break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">
            {t.account.accountType}
          </dt>
          <dd className="mt-1 font-semibold">{t.account.roles[user.role]}</dd>
        </div>
      </dl>
      <form action={signOut} className="mt-8">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="rounded-full border border-border bg-surface px-5 py-2.5 font-semibold hover:bg-surface-muted"
        >
          {t.account.signOut}
        </button>
      </form>
    </>
  );
}

export default async function AccountPage() {
  const t = await getMessages();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Suspense
          fallback={
            <p className="text-muted-foreground">{t.account.loading}</p>
          }
        >
          <AccountDetails />
        </Suspense>
      </main>
    </>
  );
}
