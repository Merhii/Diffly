import { Moon, Sun } from "lucide-react";
import { useDiff } from "../context/DiffContext";

export default function ThemeToggle() {
  const {
    state: { theme },
    toggleTheme,
  } = useDiff();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
