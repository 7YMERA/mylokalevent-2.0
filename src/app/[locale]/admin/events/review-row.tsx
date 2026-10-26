"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/form-field";
import type { Locale } from "@/i18n/config";

import { decideEvent, type DecisionState } from "./actions";

type Labels = {
  by: string;
  when: string;
  where: string;
  approve: string;
  reject: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  notAdmin: string;
  reasonRequired: string;
  actionFailed: string;
  pleaseWait: string;
};

export function EventReviewRow({
  event,
  locale,
  labels,
}: {
  event: {
    id: string;
    title: string;
    slug: string;
    organiserName: string | null;
    startsLabel: string;
    where: string;
  };
  locale: Locale;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    decideEvent,
    {},
  );

  const errorText =
    state.error === "notAdmin"
      ? labels.notAdmin
      : state.error === "reasonRequired"
        ? labels.reasonRequired
        : state.error
          ? labels.actionFailed
          : undefined;

  return (
    <li className="rounded-3xl border border-border bg-surface p-5">
      <p className="font-display text-lg font-bold tracking-tight">
        {event.title}
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">{labels.by}</dt>
          <dd className="mt-0.5 font-semibold">{event.organiserName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{labels.when}</dt>
          <dd className="mt-0.5 font-semibold">{event.startsLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{labels.where}</dt>
          <dd className="mt-0.5 font-semibold">{event.where}</dd>
        </div>
      </dl>

      {errorText ? (
        <div className="mt-4">
          <FormAlert tone="danger">{errorText}</FormAlert>
        </div>
      ) : null}

      <form action={action} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="target" value={event.id} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{labels.reasonLabel}</span>
          <input
            name="reason"
            placeholder={labels.reasonPlaceholder}
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="decision"
            value="approved"
            disabled={pending}
            className="rounded-full bg-success px-5 py-2.5 font-semibold text-background transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending ? labels.pleaseWait : labels.approve}
          </button>
          <button
            type="submit"
            name="decision"
            value="rejected"
            disabled={pending}
            className="rounded-full border border-danger/40 bg-danger-soft px-5 py-2.5 font-semibold text-danger transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {labels.reject}
          </button>
        </div>
      </form>
    </li>
  );
}
