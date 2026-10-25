import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a complete configuration", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://mylokalevent.my",
    });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://mylokalevent.my");
  });

  it("rejects a missing variable", () => {
    expect(() => parseEnv({})).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it.each(["", "change-me", "your-site-url", "XXXX"])(
    "rejects the placeholder %j",
    (value) => {
      expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: value })).toThrow(
        /placeholder/,
      );
    },
  );

  it("rejects a value that is not a URL", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "mylokalevent" })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
  });
});
