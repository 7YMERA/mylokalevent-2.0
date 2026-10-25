import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isLocale, localeCookie, localePath, pickLocale } from "@/i18n/config";
import { env } from "@/lib/env";
import { cookieOptions } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/supabase/database.types";

// Runs before every page request:
// 1. Sends unprefixed URLs ("/sign-in") to the visitor's language
//    ("/ms/sign-in"), from their saved choice or browser settings.
// 2. Refreshes the Supabase session cookie, so Server Components always see a
//    valid session.
// 3. Remembers the language of the page being viewed.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1];
  const savedLocale = request.cookies.get(localeCookie)?.value;

  // Route handlers, Next.js internals (/_next, /__nextjs in dev) and files
  // such as /robots.txt are not pages, so they never get a locale prefix.
  const isPage =
    !pathname.startsWith("/auth/") &&
    !pathname.startsWith("/_") &&
    !/\.\w+$/.test(pathname);

  if (isPage && !isLocale(segment)) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(
      pickLocale(savedLocale, request.headers.get("accept-language")),
      pathname,
    );
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    env();

  const supabase = createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  await supabase.auth.getClaims();

  if (isLocale(segment) && segment !== savedLocale) {
    response.cookies.set(localeCookie, segment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
