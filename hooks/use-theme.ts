"use client";

import { useEffect, useState } from "react";
import { applyThemeToDocument, getInitialTheme, persistTheme } from "@/services/theme/theme.service";

export function useTheme() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    applyThemeToDocument(isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    applyThemeToDocument(nextTheme);
    persistTheme(nextTheme);
    setIsDark(nextTheme);
  };

  return { isDark, toggleTheme };
}
