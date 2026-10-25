import { describe, expect, it } from "vitest";

import en from "./en.json";
import ms from "./ms.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>(
    (out, [key, value]) =>
      typeof value === "string"
        ? { ...out, [prefix + key]: value }
        : { ...out, ...flatten(value, `${prefix}${key}.`) },
    {},
  );
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("translations", () => {
  const flatEn = flatten(en);
  const flatMs = flatten(ms);

  it("BM and English have exactly the same keys", () => {
    expect(Object.keys(flatMs).sort()).toEqual(Object.keys(flatEn).sort());
  });

  it.each(Object.keys(flatEn))(
    "%s is filled in and keeps its placeholders",
    (key) => {
      expect(flatMs[key]?.trim()).toBeTruthy();
      expect(flatEn[key].trim()).toBeTruthy();
      expect(placeholders(flatMs[key] ?? "")).toEqual(
        placeholders(flatEn[key]),
      );
    },
  );
});
