import type { Metadata } from "next";
import Link from "next/link";

import { GoogleButton, OrDivider } from "@/components/google-button";
import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return pageMetadata("/sign-in", t.signIn.title);
}

export default async function SignInPage() {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        {t.signIn.heading}
      </h1>
      <p className="mt-1 mb-6 text-muted-foreground">{t.signIn.lead}</p>
      <GoogleButton
        locale={locale}
        label={t.google.continue}
        pendingLabel={t.common.pleaseWait}
      />
      <OrDivider label={t.google.or} />
      <SignInForm
        locale={locale}
        t={{
          fields: t.fields,
          messages: t.messages,
          submit: t.signIn.submit,
          pleaseWait: t.common.pleaseWait,
        }}
      />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.signIn.newHere}{" "}
        <Link
          href={localePath(locale, "/sign-up")}
          className="font-semibold text-primary underline"
        >
          {t.signIn.createAccount}
        </Link>
      </p>
    </>
  );
}
