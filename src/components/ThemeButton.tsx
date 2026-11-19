import { Moon, Sun } from "lucide-react";
import type { Theme } from "../lib/theme";

export function ThemeButton({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const label =
    theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? (
        <Sun size={18} strokeWidth={1.8} />
      ) : (
        <Moon size={18} strokeWidth={1.8} />
      )}
    </button>
  );
}
