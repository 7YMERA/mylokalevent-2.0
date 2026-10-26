import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { format, localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth";

import { WelcomeForm } from "./welcome-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.welcome.title, robots: { index: false } };
}

// First-time Google users land here: Google can't carry the consent tick
// from our sign-up form, so they accept the privacy notice before going on.
async function Welcome() {
  const [user, locale, t] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getMessages(),
  ]);
  if (!user) redirect(localePath(locale, "/sign-in"));
  if (user.consented) redirect(localePath(locale, "/account"));

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        {t.welcome.heading}
      </h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        {format(t.welcome.lead, { name: user.displayName })}
      </p>
      <WelcomeForm
        locale={locale}
        t={{
          messages: t.messages,
          signUp: t.signUp,
          submit: t.welcome.submit,
          pleaseWait: t.common.pleaseWait,
        }}
      />
    </>
  );
}

export default async function WelcomePage() {
  const t = await getMessages();
  return (
    <Suspense
      fallback={<p className="text-muted-foreground">{t.account.loading}</p>}
    >
      <Welcome />
    </Suspense>
  );
}
