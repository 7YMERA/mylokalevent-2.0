"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/form-field";
import type { Locale } from "@/i18n/config";
import type { PendingOrganiser } from "@/lib/organisers";

import { decideOrganiser, type DecisionState } from "./actions";

type Labels = {
  state: string;
  ssm: string;
  noSsm: string;
  status: string;
  statusLabel: string;
  approve: string;
  reject: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonRequired: string;
  notAdmin: string;
  actionFailed: string;
  pleaseWait: string;
};

type Props = {
  organiser: PendingOrganiser;
  locale: Locale;
  labels: Labels;
};

export function OrganiserReviewRow({ organiser, locale, labels }: Props) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    decideOrganiser,
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold tracking-tight">
            {organiser.name}
          </p>
          <p className="text-sm text-muted-foreground">/o/{organiser.slug}</p>
        </div>
        <span className="rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
          {labels.statusLabel}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{labels.state}</dt>
          <dd className="mt-0.5 font-semibold">{organiser.state ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{labels.ssm}</dt>
          <dd className="mt-0.5 font-semibold break-all">
            {organiser.ssmNumber ?? labels.noSsm}
          </dd>
        </div>
      </dl>

      {errorText ? (
        <div className="mt-4">
          <FormAlert tone="danger">{errorText}</FormAlert>
        </div>
      ) : null}

      <form action={action} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="target" value={organiser.id} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{labels.reasonLabel}</span>
          <input
            name="reason"
            required
            placeholder={labels.reasonPlaceholder}
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="decision"
            value="verified"
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
