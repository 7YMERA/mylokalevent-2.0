import Link from "next/link";

import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth";

// Reads the session, so SiteHeader renders it inside <Suspense>.
export async function AuthStatus() {
  const [user, locale, t] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getMessages(),
  ]);

  if (!user) {
    return (
      <Link
        href={localePath(locale, "/sign-in")}
        className="whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-sm sm:px-4 font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        {t.header.signIn}
      </Link>
    );
  }

  return (
    <Link
      href={localePath(locale, "/account")}
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
