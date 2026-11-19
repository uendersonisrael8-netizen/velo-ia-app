export type Theme = "light" | "dark";

const STORAGE_KEY = "velo-ia-theme";

export function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Armazenamento indisponível: segue a preferência do sistema.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0a0a0a" : "#ffffff");

  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sem localStorage, o tema vale só para esta sessão.
  }
}
