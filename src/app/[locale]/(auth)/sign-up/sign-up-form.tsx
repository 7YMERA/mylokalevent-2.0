"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormAlert, FormField, SubmitButton } from "@/components/form-field";
import { format, localePath, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { translateMessage } from "@/i18n/translate";
import type { FormState } from "@/lib/auth-schemas";

import { signUp } from "../actions";

type Props = {
  locale: Locale;
  t: Pick<Messages, "fields" | "messages" | "signUp"> & {
    pleaseWait: string;
  };
};

export function SignUpForm({ locale, t }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUp,
    {},
  );
  const message = (key?: string) => translateMessage(t.messages, key);

  if (state.message) {
    return (
      <FormAlert tone="success">
        {format(message(state.message) ?? "", {
          email: state.values?.email ?? "",
        })}
      </FormAlert>
    );
  }

  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <FormAlert tone="danger">{message(state.error)}</FormAlert>
      )}
      <FormField
        label={t.fields.name}
        name="displayName"
        autoComplete="name"
        defaultValue={state.values?.displayName}
        required
        error={message(errors.displayName)}
      />
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
        autoComplete="new-password"
        required
        minLength={10}
        hint={t.signUp.passwordHint}
        error={message(errors.password)}
      />
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={errors.consent ? true : undefined}
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
        {errors.consent && (
          <p className="text-sm text-danger">{message(errors.consent)}</p>
        )}
      </div>
      <SubmitButton pending={pending} pendingLabel={t.pleaseWait}>
        {t.signUp.submit}
      </SubmitButton>
    </form>
  );
}
