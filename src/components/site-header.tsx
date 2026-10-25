import Link from "next/link";

import { ThemeSwitcher } from "./theme-switcher";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight"
        >
          MyLokal<span className="text-primary">Event</span>
        </Link>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
