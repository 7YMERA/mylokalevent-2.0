"use client";

import { useActionState } from "react";

import {
  FormAlert,
  FormField,
  SelectField,
  SubmitButton,
} from "@/components/form-field";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { translateMessage } from "@/i18n/translate";
import { MALAYSIAN_STATES } from "@/lib/geo";
import type { FormState } from "@/lib/organiser-schemas";

import { applyOrganiser } from "./actions";

type Props = {
  locale: Locale;
  t: Pick<Messages, "messages"> & {
    apply: Messages["apply"];
    pleaseWait: string;
  };
};

export function ApplyForm({ locale, t }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    applyOrganiser,
    {},
  );
  const message = (key?: string) => translateMessage(t.messages, key);

  if (state.message) {
    return <FormAlert tone="success">{t.apply.success}</FormAlert>;
  }

  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <FormAlert tone="danger">{message(state.error)}</FormAlert>
      )}
      <FormField
        label={t.apply.name}
        name="name"
        defaultValue={v.name}
        required
        error={message(errors.name)}
      />
      <FormField
        label={t.apply.slug}
        name="slug"
        defaultValue={v.slug}
        required
        hint={t.apply.slugHint}
        error={message(errors.slug)}
      />
      <FormField
        label={t.apply.phone}
        name="phone"
        type="tel"
        inputMode="tel"
        defaultValue={v.phone}
        required
        error={message(errors.phone)}
      />
      <SelectField
        label={t.apply.state}
        name="state"
        placeholder={t.apply.statePlaceholder}
        defaultValue={v.state}
        required
        options={MALAYSIAN_STATES.map((s) => ({ value: s, label: s }))}
        error={message(errors.state)}
      />
      <FormField
        label={t.apply.ssm}
        name="ssmNumber"
        defaultValue={v.ssmNumber}
        hint={t.apply.ssmHint}
        error={message(errors.ssmNumber)}
      />
      <SubmitButton pending={pending} pendingLabel={t.pleaseWait}>
        {t.apply.submit}
      </SubmitButton>
    </form>
  );
}
