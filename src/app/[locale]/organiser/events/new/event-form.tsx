"use client";

import { createClient } from "@supabase/supabase-js";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

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

import {
  finishImageUpload,
  prepareImageUpload,
  saveEventDraft,
} from "./actions";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Sends each photo straight to Storage with a one-time signed URL, then asks
// the server to re-encode it. Returns the first error key, if any.
async function uploadImages(
  eventId: string,
  files: File[],
): Promise<string | undefined> {
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ).storage.from("event-images");

  for (const [index, file] of files.slice(0, MAX_IMAGES).entries()) {
    if (file.size > MAX_IMAGE_BYTES) return "imageTooLarge";
    const ticket = await prepareImageUpload(eventId);
    if ("error" in ticket) return ticket.error;
    const { error } = await storage.uploadToSignedUrl(
      ticket.path,
      ticket.token,
      file,
      { contentType: file.type || "application/octet-stream" },
    );
    if (error) return "imageFailed";
    const done = await finishImageUpload(eventId, ticket.path, index);
    if (done.error) return done.error;
  }
  return undefined;
}

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

  // Photos are held back from the form post and uploaded once the draft
  // exists, so a large photo never hits the Server Action body limit.
  const files = useRef<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  useEffect(() => {
    const eventId = state.eventId;
    const pendingFiles = files.current;
    if (!eventId || pendingFiles.length === 0) return;
    files.current = [];
    setUploading(true);
    uploadImages(eventId, pendingFiles)
      .then(setUploadError)
      .catch(() => setUploadError("imageFailed"))
      .finally(() => setUploading(false));
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    files.current = formData
      .getAll("images")
      .filter((item): item is File => item instanceof File && item.size > 0);
    formData.delete("images");
    setUploadError(undefined);
    startTransition(() => action(formData));
  }

  const busy = pending || uploading;
  const error = state.error ?? uploadError;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {state.message && !busy && (
        <FormAlert tone="success">{f.draftSaved}</FormAlert>
      )}
      {error && !busy && <FormAlert tone="danger">{message(error)}</FormAlert>}

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
      <SubmitButton pending={busy} pendingLabel={t.pleaseWait}>
        {f.saveDraft}
      </SubmitButton>
    </form>
  );
}
