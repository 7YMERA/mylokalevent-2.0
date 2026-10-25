import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SITE_URL: "https://mylokalevent.my",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("parseEnv", () => {
  it("accepts a complete configuration", () => {
    const env = parseEnv({ NODE_ENV: "production", ...valid });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://mylokalevent.my");
  });

  it("rejects a missing variable", () => {
    expect(() => parseEnv({})).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it.each(["", "change-me", "your-site-url", "XXXX"])(
    "rejects the placeholder %j",
    (value) => {
      expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SITE_URL: value })).toThrow(
        /placeholder/,
      );
    },
  );

  it("rejects the example Supabase URL from .env.example", () => {
    expect(() =>
      parseEnv({
        ...valid,
        NEXT_PUBLIC_SUPABASE_URL: "https://your-project-ref.supabase.co",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejects a value that is not a URL", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SITE_URL: "mylokalevent" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
