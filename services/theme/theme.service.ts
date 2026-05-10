const THEME_STORAGE_KEY = "socialshop-theme";

export function getInitialTheme(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return stored ? stored === "dark" : prefersDark;
}

export function persistTheme(isDark: boolean) {
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
}

export function applyThemeToDocument(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}
