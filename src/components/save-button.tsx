"use client";

import Link from "next/link";
import { useActionState } from "react";

import { localePath, type Locale } from "@/i18n/config";
import { toggleSaveEvent, type ToggleState } from "@/lib/engagement-actions";

export function SaveButton({
  eventId,
  initialSaved,
  signedIn,
  locale,
  labels,
}: {
  eventId: string;
  initialSaved: boolean;
  signedIn: boolean;
  locale: Locale;
  labels: { save: string; saved: string; signIn: string };
}) {
  const [state, action, pending] = useActionState<ToggleState, FormData>(
    toggleSaveEvent,
    { saved: initialSaved },
  );
  const saved = state.saved ?? initialSaved;

  if (!signedIn) {
    return (
      <Link
        href={localePath(locale, "/sign-in")}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-muted"
      >
        {labels.signIn}
      </Link>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="current" value={String(saved)} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={saved}
        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          saved
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-surface hover:bg-surface-muted"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
        </svg>
        {saved ? labels.saved : labels.save}
      </button>
    </form>
  );
}
