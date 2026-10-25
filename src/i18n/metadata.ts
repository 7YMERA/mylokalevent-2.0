import type { Metadata } from "next";

import { defaultLocale, localePath, locales } from "./config";
import { getLocale } from "./messages";

// Title plus links to the same page in every language, so search engines
// show each visitor the right one.
export async function pageMetadata(
  path: string,
  title?: string,
): Promise<Metadata> {
  const locale = await getLocale();
  return {
    ...(title && { title }),
    alternates: {
      canonical: localePath(locale, path),
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])),
        "x-default": localePath(defaultLocale, path),
      },
    },
  };
}
