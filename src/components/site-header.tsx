import Link from "next/link";
import { Suspense } from "react";

import { AuthStatus } from "./auth-status";
import { ThemeSwitcher } from "./theme-switcher";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight"
        >
          MyLokal<span className="text-primary">Event</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Suspense fallback={<div className="h-8 w-20" />}>
            <AuthStatus />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
