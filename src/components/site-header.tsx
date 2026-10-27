import Link from "next/link";
import { Suspense } from "react";

import { localePath } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";

import { AuthStatus } from "./auth-status";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./logo-mark";
import { ThemeSwitcher } from "./theme-switcher";

export async function SiteHeader() {
  const [locale, t] = await Promise.all([getLocale(), getMessages()]);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-1.5 px-4">
        <Link
          href={localePath(locale)}
          aria-label={t.header.home}
          className="flex shrink-0 items-center gap-2 font-display text-base font-bold tracking-tight sm:text-lg"
        >
          <LogoMark className="size-7 sm:size-8" />
          {/* Narrow phones (under 380px) show the mark alone so the header fits. */}
          <span className="max-[379px]:sr-only">
            MyLokal<span className="text-primary">Event</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher current={locale} label={t.header.language} />
          <ThemeSwitcher
            labels={{
              group: t.header.theme,
              system: t.header.themeSystem,
              light: t.header.themeLight,
              dark: t.header.themeDark,
            }}
          />
          <Suspense fallback={<div className="h-8 w-20" />}>
            <AuthStatus />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
