"use client";

import { useActionState } from "react";

import {
  FormAlert,
  FormField,
  SelectField,
  SubmitButton,
  TextareaField,
} from "@/components/form-field";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { translateMessage } from "@/i18n/translate";
import { MALAYSIAN_STATES } from "@/lib/geo";
import type { FormState } from "@/lib/organiser-schemas";

import { saveEventDraft } from "./actions";

type CategoryOption = { value: string; label: string };

type Props = {
  locale: Locale;
  categories: CategoryOption[];
  t: Pick<Messages, "messages"> & {
    form: Messages["eventForm"];
    pleaseWait: string;
  };
};

export function EventForm({ locale, categories, t }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveEventDraft,
    {},
  );
  const message = (key?: string) => translateMessage(t.messages, key);
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const f = t.form;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {state.message && <FormAlert tone="success">{f.draftSaved}</FormAlert>}
      {state.error && (
        <FormAlert tone="danger">{message(state.error)}</FormAlert>
      )}

      <FormField
        label={f.titleField}
        name="title"
        defaultValue={v.title}
        required
        error={message(errors.title)}
      />
      <FormField
        label={f.slug}
        name="slug"
        defaultValue={v.slug}
        required
        hint={f.slugHint}
        error={message(errors.slug)}
      />
      <SelectField
        label={f.category}
        name="categorySlug"
        placeholder={f.categoryPlaceholder}
        defaultValue={v.categorySlug}
        required
        options={categories}
        error={message(errors.categorySlug)}
      />
      <TextareaField
        label={f.description}
        name="description"
        defaultValue={v.description}
        required
        rows={6}
        error={message(errors.description)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={f.startsAt}
          name="startsAt"
          type="datetime-local"
          defaultValue={v.startsAt}
          required
          error={message(errors.startsAt)}
        />
        <FormField
          label={f.endsAt}
          name="endsAt"
          type="datetime-local"
          defaultValue={v.endsAt}
          error={message(errors.endsAt)}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label={f.state}
          name="state"
          placeholder={f.statePlaceholder}
          defaultValue={v.state}
          required
          options={MALAYSIAN_STATES.map((s) => ({ value: s, label: s }))}
          error={message(errors.state)}
        />
        <FormField
          label={f.district}
          name="district"
          defaultValue={v.district}
          required
          error={message(errors.district)}
        />
      </div>
      <FormField
        label={f.venue}
        name="venue"
        defaultValue={v.venue}
        required
        error={message(errors.venue)}
      />
      <FormField
        label={f.fee}
        name="feeMyr"
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={v.feeMyr}
        hint={f.feeHint}
        error={message(errors.feeMyr)}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="images" className="text-sm font-semibold">
          {f.images}
        </label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-surface-muted file:px-3 file:py-1 file:text-sm file:font-semibold"
        />
        <p className="text-sm text-muted-foreground">{f.imagesHint}</p>
      </div>
      <SubmitButton pending={pending} pendingLabel={t.pleaseWait}>
        {f.saveDraft}
      </SubmitButton>
    </form>
  );
}
