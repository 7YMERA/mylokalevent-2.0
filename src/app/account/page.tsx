import type { Metadata } from "next";
import { Suspense } from "react";

import { signOut } from "@/app/(auth)/actions";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Your account · MyLokalEvent",
  robots: { index: false },
};

const roleLabels = {
  member: "Member",
  organiser: "Organiser",
  admin: "Admin",
} as const;

async function AccountDetails() {
  const user = await requireUser();
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        Hi, {user.displayName}
      </h1>
      <dl className="mt-8 grid gap-4 rounded-3xl border border-border bg-surface p-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="mt-1 font-semibold break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Account type</dt>
          <dd className="mt-1 font-semibold">{roleLabels[user.role]}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Language</dt>
          <dd className="mt-1 font-semibold">
            {user.locale === "ms" ? "Bahasa Melayu" : "English"}
          </dd>
        </div>
      </dl>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="rounded-full border border-border bg-surface px-5 py-2.5 font-semibold hover:bg-surface-muted"
        >
          Sign out
        </button>
      </form>
    </>
  );
}

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Suspense
          fallback={
            <p className="text-muted-foreground">Loading your account…</p>
          }
        >
          <AccountDetails />
        </Suspense>
      </main>
    </>
  );
}
