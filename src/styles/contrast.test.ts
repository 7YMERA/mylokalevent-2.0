import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

// Pull "--name: #hex;" declarations out of the first block after `selector`.
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const block = css.slice(open + 1, close);
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [
      m[1],
      m[2].toLowerCase(),
    ]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = tokens(':root,\n[data-theme="light"] {');
const dark = tokens(':root:not([data-theme="light"]) {');
const darkOverride = tokens('\n[data-theme="dark"] {');

// [text, background] pairs that must meet WCAG AA for normal text (4.5:1).
const surfaces = ["background", "surface", "surface-muted"];
const textPairs: [string, string][] = [
  ...surfaces.flatMap((s): [string, string][] => [
    ["foreground", s],
    ["muted-foreground", s],
    ["primary", s],
  ]),
  ["primary-foreground", "primary"],
  ["primary-foreground", "primary-hover"],
  ["accent-foreground", "accent"],
  ["accent", "surface"],
  ["hero-foreground", "hero-from"],
  ["hero-foreground", "hero-to"],
  ["danger", "surface"],
  ...["success", "warning", "danger"].map((s): [string, string] => [
    s,
    `${s}-soft`,
  ]),
  ...["competition", "market", "pond", "community"].flatMap(
    (c): [string, string][] => [
      [`cat-${c}`, `cat-${c}-soft`],
      [`cat-${c}`, "surface"],
    ],
  ),
];

// Non-text UI that must meet WCAG AA for components (3:1).
const uiPairs: [string, string][] = [
  ...surfaces.map((s): [string, string] => ["ring", s]),
  // The logo sits on the page background in the header.
  ["logo-wing", "background"],
  ["logo-tail", "background"],
];

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme", (_name, theme) => {
  it.each(textPairs)("%s on %s is readable (4.5:1)", (fg, bg) => {
    expect(theme[fg], `--${fg} missing`).toBeDefined();
    expect(theme[bg], `--${bg} missing`).toBeDefined();
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(uiPairs)("%s on %s is visible (3:1)", (fg, bg) => {
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(3);
  });
});

describe("theme definitions", () => {
  it("defines every light token in dark mode too", () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it("keeps the OS dark theme and the manual dark theme identical", () => {
    expect(darkOverride).toEqual(dark);
  });
});
