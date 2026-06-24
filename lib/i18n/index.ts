import { bn } from "./bn";
import { en } from "./en";
import type { Language, TranslationDict } from "./types";

export type { Language, TranslationDict };

export const translations: Record<Language, TranslationDict> = { bn, en };

export function t(key: string, lang: Language): string {
  return translations[lang]?.[key] ?? translations["en"]?.[key] ?? key;
}
