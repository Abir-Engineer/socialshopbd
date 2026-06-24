"use client";

import { useLanguage } from "@/hooks/use-language";

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-card-foreground transition hover:bg-muted"
      aria-label={lang === "bn" ? "Switch to English" : "বাংলায় switch করুন"}
    >
      <span className="text-xs font-semibold" aria-hidden>
        {lang === "bn" ? "EN" : "বাং"}
      </span>
    </button>
  );
}
