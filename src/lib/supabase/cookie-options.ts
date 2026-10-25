import type { CookieOptionsWithName } from "@supabase/ssr";

// Only the server touches the session, so the cookie can be hidden from
// JavaScript entirely (an XSS bug cannot read it).
export const cookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
