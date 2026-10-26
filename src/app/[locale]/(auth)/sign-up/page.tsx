import type { Metadata } from "next";
import Link from "next/link";

import { GoogleButton, OrDivider } from "@/components/google-button";
import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";
import { env } from "@/lib/env";

import { SignUpForm } from "./sign-up-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return pageMetadata("/sign-up", t.signUp.title);
}

export default async function SignUpPage() {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        {t.signUp.heading}
      </h1>
      <p className="mt-1 mb-6 text-muted-foreground">{t.signUp.lead}</p>
      {env().GOOGLE_SIGN_IN === "on" && (
        <>
          <GoogleButton
            locale={locale}
            label={t.google.continue}
            pendingLabel={t.common.pleaseWait}
          />
          <OrDivider label={t.google.or} />
        </>
      )}
      <SignUpForm
        locale={locale}
        t={{
          fields: t.fields,
          messages: t.messages,
          signUp: t.signUp,
          pleaseWait: t.common.pleaseWait,
        }}
      />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.signUp.haveAccount}{" "}
        <Link
          href={localePath(locale, "/sign-in")}
          className="font-semibold text-primary underline"
        >
          {t.signUp.signIn}
        </Link>
      </p>
    </>
  );
}
