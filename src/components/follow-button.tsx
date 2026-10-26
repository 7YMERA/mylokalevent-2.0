"use client";

import Link from "next/link";
import { useActionState } from "react";

import { localePath, type Locale } from "@/i18n/config";
import {
  toggleFollowOrganiser,
  type ToggleState,
} from "@/lib/engagement-actions";

export function FollowButton({
  organiserId,
  initialFollowing,
  signedIn,
  locale,
  labels,
}: {
  organiserId: string;
  initialFollowing: boolean;
  signedIn: boolean;
  locale: Locale;
  labels: { follow: string; following: string; signIn: string };
}) {
  const [state, action, pending] = useActionState<ToggleState, FormData>(
    toggleFollowOrganiser,
    { following: initialFollowing },
  );
  const following = state.following ?? initialFollowing;

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
      <input type="hidden" name="organiserId" value={organiserId} />
      <input type="hidden" name="current" value={String(following)} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={following}
        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          following
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-surface hover:bg-surface-muted"
        }`}
      >
        {following ? labels.following : labels.follow}
      </button>
    </form>
  );
}
