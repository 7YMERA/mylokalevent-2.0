"use client";

import { useSyncExternalStore } from "react";

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

const options: { value: Theme; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const listeners = new Set<() => void>();

function readTheme(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : "system";
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

export function ThemeSwitcher() {
  const current = useSyncExternalStore(subscribe, readTheme, () => "system");

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex rounded-full border border-border bg-surface p-0.5"
    >
      {options.map((option) => {
        const selected = current === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={`grid size-8 place-items-center rounded-full transition-colors ${
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
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
              {icons[option.value]}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
