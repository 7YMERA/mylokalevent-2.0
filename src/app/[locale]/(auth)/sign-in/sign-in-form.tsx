"use client";

import { useActionState } from "react";

import { FormAlert, FormField, SubmitButton } from "@/components/form-field";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { translateMessage } from "@/i18n/translate";
import type { FormState } from "@/lib/auth-schemas";

import { signIn } from "../actions";

type Props = {
  locale: Locale;
  t: Pick<Messages, "fields" | "messages"> & {
    submit: string;
    pleaseWait: string;
  };
};

export function SignInForm({ locale, t }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signIn,
    {},
  );
  const message = (key?: string) => translateMessage(t.messages, key);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <FormAlert tone="danger">{message(state.error)}</FormAlert>
      )}
      <FormField
        label={t.fields.email}
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        required
        error={message(errors.email)}
      />
      <FormField
        label={t.fields.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={message(errors.password)}
      />
      <SubmitButton pending={pending} pendingLabel={t.pleaseWait}>
        {t.submit}
      </SubmitButton>
    </form>
  );
}
