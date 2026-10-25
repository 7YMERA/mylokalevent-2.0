import { describe, expect, it } from "vitest";

import { format, localePath, pickLocale, switchLocalePath } from "./config";
import { formatEventDate } from "./format";

describe("pickLocale", () => {
  it("prefers the saved choice", () => {
    expect(pickLocale("en", "ms-MY,ms;q=0.9")).toBe("en");
  });

  it("ignores an invalid saved value", () => {
    expect(pickLocale("fr", "en-GB,en;q=0.9")).toBe("en");
  });

  it("uses the highest-ranked supported browser language", () => {
    expect(pickLocale(undefined, "zh-CN,en;q=0.8,ms;q=0.9")).toBe("ms");
    expect(pickLocale(undefined, "en-MY")).toBe("en");
  });

  it("falls back to BM", () => {
    expect(pickLocale(undefined, null)).toBe("ms");
    expect(pickLocale(undefined, "zh-CN,ta;q=0.5")).toBe("ms");
    expect(pickLocale(undefined, "en;q=0")).toBe("ms");
  });
});

describe("locale paths", () => {
  it("prefixes paths", () => {
    expect(localePath("ms")).toBe("/ms");
    expect(localePath("en", "/sign-in")).toBe("/en/sign-in");
  });

  it("switches the language of a localised path", () => {
    expect(switchLocalePath("/ms/sign-in", "en")).toBe("/en/sign-in");
    expect(switchLocalePath("/en", "ms")).toBe("/ms");
    expect(switchLocalePath("/en/", "ms")).toBe("/ms");
    expect(switchLocalePath("/privacy", "en")).toBe("/en/privacy");
  });
});

describe("format", () => {
  it("fills placeholders and leaves unknown ones", () => {
    expect(format("Hi, {name} {x}", { name: "Ali" })).toBe("Hi, Ali {x}");
  });
});

describe("formatEventDate", () => {
  it("shows Malaysian time in each language", () => {
    const iso = "2027-03-13T23:00:00Z";
    expect(formatEventDate(iso, "en")).toMatch(/Sun, 14 Mar 2027.*7:00/);
    expect(formatEventDate(iso, "ms")).toMatch(/Ahd, 14 Mac 2027.*7:00/);
  });
});
