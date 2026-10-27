"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const icons: Record<Theme, React.ReactNode> = {
  system: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
};

const themes: Theme[] = ["system", "light", "dark"];

export type ThemeLabels = {
  group: string;
} & Record<Theme, string>;

const listeners = new Set<() => void>();

function readTheme(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : "system";
}

function savedTheme(): Theme {
  const match = document.cookie.match(/(?:^|; )theme=(light|dark)(?:;|$)/);
  return match ? (match[1] as Theme) : "system";
}

function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
    document.cookie = "theme=; path=/; max-age=0; SameSite=Lax";
  } else {
    root.setAttribute("data-theme", theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

// Switching language swaps the root layout, and React clears the attributes on
// <html> when it does, so data-theme is lost. ThemeScript only runs on a full
// page load, so this puts the saved theme back after each layout mount.
export function ThemeSync() {
  useLayoutEffect(() => {
    setTheme(savedTheme());
  }, []);
  return null;
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[theme]}
    </svg>
  );
}

export function ThemeSwitcher({ labels }: { labels: ThemeLabels }) {
  const current = useSyncExternalStore(
    subscribe,
    readTheme,
    (): Theme => "system",
  );
  const next = themes[(themes.indexOf(current) + 1) % themes.length];

  return (
    <>
      {/* Phones: one button that cycles, to leave room in the header. */}
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={`${labels.group}: ${labels[current]}`}
        title={`${labels.group}: ${labels[current]}`}
        className="grid size-9 place-items-center rounded-full border border-border bg-surface text-foreground sm:hidden"
      >
        <ThemeIcon theme={current} />
      </button>
      <div
        role="radiogroup"
        aria-label={labels.group}
        className="hidden rounded-full border border-border bg-surface p-0.5 sm:inline-flex"
      >
        {themes.map((theme) => {
          const selected = current === theme;
          return (
            <button
              key={theme}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={labels[theme]}
              title={labels[theme]}
              onClick={() => setTheme(theme)}
              className={`grid size-8 place-items-center rounded-full transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThemeIcon theme={theme} />
            </button>
          );
        })}
      </div>
    </>
  );
}
