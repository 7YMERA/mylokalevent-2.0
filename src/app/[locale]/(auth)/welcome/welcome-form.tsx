"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormAlert, SubmitButton } from "@/components/form-field";
import { localePath, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { translateMessage } from "@/i18n/translate";
import type { FormState } from "@/lib/auth-schemas";

import { acceptPrivacyNotice } from "../actions";

type Props = {
  locale: Locale;
  t: Pick<Messages, "messages" | "signUp"> & {
    submit: string;
    pleaseWait: string;
  };
};

export function WelcomeForm({ locale, t }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    acceptPrivacyNotice,
    {},
  );
  const message = (key?: string) => translateMessage(t.messages, key);
  const consentError = state.fieldErrors?.consent;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <FormAlert tone="danger">{message(state.error)}</FormAlert>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={consentError ? true : undefined}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            {t.signUp.consentBefore}{" "}
            <Link
              href={localePath(locale, "/privacy")}
              className="font-semibold text-primary underline"
            >
              {t.signUp.consentLink}
            </Link>
            {t.signUp.consentAfter}
          </span>
        </label>
        {consentError && (
          <p className="text-sm text-danger">{message(consentError)}</p>
        )}
      </div>
      <SubmitButton pending={pending} pendingLabel={t.pleaseWait}>
        {t.submit}
      </SubmitButton>
    </form>
  );
}
