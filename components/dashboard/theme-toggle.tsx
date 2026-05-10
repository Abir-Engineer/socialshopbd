"use client";

import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-card-foreground transition hover:bg-muted"
      aria-label="Toggle dark mode"
    >
      <span className="text-base" aria-hidden>
        {isDark ? "L" : "D"}
      </span>
    </button>
  );
}
