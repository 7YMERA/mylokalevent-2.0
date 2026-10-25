"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  localeCookie,
  localeNames,
  locales,
  switchLocalePath,
  type Locale,
} from "@/i18n/config";

// Saved here as well as in the proxy, because a client-side navigation can be
// served from a prefetch that never passes through the proxy.
function rememberLocale(locale: Locale) {
  document.cookie = `${localeCookie}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LanguageSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className="inline-flex rounded-full border border-border bg-surface p-0.5"
    >
      {locales.map((locale) => {
        const selected = locale === current;
        return (
          <Link
            key={locale}
            href={switchLocalePath(pathname, locale)}
            hrefLang={locale}
            onClick={() => rememberLocale(locale)}
            lang={locale}
            aria-current={selected ? "true" : undefined}
            title={localeNames[locale].long}
            className={`grid h-8 min-w-9 place-items-center rounded-full px-2 sm:min-w-10 text-xs font-bold transition-colors ${
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span aria-hidden="true">{localeNames[locale].short}</span>
            <span className="sr-only">{localeNames[locale].long}</span>
          </Link>
        );
      })}
    </nav>
  );
}
