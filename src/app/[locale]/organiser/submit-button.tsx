"use client";

import { useActionState } from "react";

import type { Locale } from "@/i18n/config";
import {
  submitEventForReview,
  type SubmitState,
} from "./events/submit-actions";

export function SubmitButton({
  eventId,
  locale,
  label,
  pendingLabel,
  errorLabels,
}: {
  eventId: string;
  locale: Locale;
  label: string;
  pendingLabel: string;
  errorLabels: {
    generic: string;
    notOrganiser: string;
    paymentsUnavailable: string;
    paymentProcessing: string;
  };
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitEventForReview,
    {},
  );

  const errorText =
    state.error === "paymentsUnavailable"
      ? errorLabels.paymentsUnavailable
      : state.error === "paymentProcessing"
        ? errorLabels.paymentProcessing
        : state.error === "notOrganiser"
          ? errorLabels.notOrganiser
          : state.error
            ? errorLabels.generic
            : undefined;

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="eventId" value={eventId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? pendingLabel : label}
      </button>
      {errorText ? (
        <p role="alert" className="text-sm text-danger">
          {errorText}
        </p>
      ) : null}
    </form>
  );
}
