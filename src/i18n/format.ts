import type { Locale } from "./config";

const intlLocales: Record<Locale, string> = { ms: "ms-MY", en: "en-MY" };

// Event times are always shown in Malaysian time, wherever the server runs.
export function formatEventDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(iso));
}
