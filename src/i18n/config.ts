// Locale settings shared by the proxy, Server Components and Client Components.

export const locales = ["ms", "en"] as const;
export type Locale = (typeof locales)[number];

// Most of the audience reads BM first.
export const defaultLocale: Locale = "ms";

// Remembers the visitor's last choice so unprefixed links land in it.
export const localeCookie = "locale";

export const localeNames: Record<Locale, { short: string; long: string }> = {
  ms: { short: "BM", long: "Bahasa Melayu" },
  en: { short: "EN", long: "English" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

// "/sign-in" -> "/ms/sign-in", "/" -> "/ms"
export function localePath(locale: Locale, path = "/"): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

// Swaps the locale segment of a localised pathname, keeping the rest.
export function switchLocalePath(pathname: string, locale: Locale): string {
  const [, first, ...rest] = pathname.split("/");
  const tail = isLocale(first) ? rest : [first, ...rest];
  return localePath(locale, `/${tail.join("/")}`.replace(/\/$/, "") || "/");
}

// Saved choice first, then the browser's languages, then the default.
export function pickLocale(
  saved: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(saved)) return saved;

  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        language: tag.split("-")[0].toLowerCase(),
        q: q ? Number(q.trim().slice(2)) : 1,
      };
    })
    .filter((entry) => entry.language && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  const match = preferred.find((entry) => isLocale(entry.language));
  return match && isLocale(match.language) ? match.language : defaultLocale;
}

// Fills "{name}" placeholders in a message.
export function format(
  message: string,
  values: Record<string, string | number>,
): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
