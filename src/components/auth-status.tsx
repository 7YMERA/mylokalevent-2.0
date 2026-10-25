import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";

// Reads the session, so SiteHeader renders it inside <Suspense>.
export async function AuthStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-3 pl-1 text-sm font-semibold"
    >
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-full bg-accent text-accent-foreground"
      >
        {user.displayName.charAt(0).toUpperCase()}
      </span>
      <span className="max-w-32 truncate">{user.displayName}</span>
    </Link>
  );
}
