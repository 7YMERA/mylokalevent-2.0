import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/[locale]/(auth)/actions";
import { CategoryBadge } from "@/components/category-badge";
import { SiteHeader } from "@/components/site-header";
import { format, localePath } from "@/i18n/config";
import { formatEventDate } from "@/i18n/format";
import { getLocale, getMessages } from "@/i18n/messages";
import { requireUser } from "@/lib/auth";
import { listSavedEvents } from "@/lib/engagement";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.account.title, robots: { index: false } };
}

async function AccountDetails() {
  const [user, locale, t, saved] = await Promise.all([
    requireUser(),
    getLocale(),
    getMessages(),
    listSavedEvents(),
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

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {t.engagement.savedEvents}
        </h2>
        {saved.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-dashed border-border bg-surface-muted p-6 text-center text-muted-foreground">
            {t.engagement.noSaved}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {saved.map((event) => (
              <li key={event.slug}>
                <Link
                  href={localePath(locale, `/events/${event.slug}`)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-muted"
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-semibold">{event.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatEventDate(event.startsAt, locale)} · {event.state}
                    </span>
                  </span>
                  <CategoryBadge category={event.categorySlug} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

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
