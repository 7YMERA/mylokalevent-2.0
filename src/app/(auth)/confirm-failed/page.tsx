import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Link expired · MyLokalEvent",
  robots: { index: false },
};

export default function ConfirmFailedPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        That link didn&apos;t work
      </h1>
      <p className="mt-2 text-muted-foreground">
        Confirmation links expire and can only be used once. If you already
        confirmed, just sign in. Otherwise, sign up again for a fresh link.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/sign-in"
          className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full border border-border px-5 py-2.5 font-semibold"
        >
          Sign up
        </Link>
      </div>
    </>
  );
}
