import type { Accent, Theme } from "../types";

const STORAGE_KEY = "diff-viewer:theme";
const ACCENT_STORAGE_KEY = "diff-viewer:accent";

export function getSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function writeStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function getInitialTheme(): Theme {
  return readStoredTheme() ?? getSystemTheme();
}

export function readStoredAccent(): Accent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return value === "indigo" || value === "teal" || value === "amber" ? value : null;
}

export function writeStoredAccent(accent: Accent): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
}

export function getInitialAccent(): Accent {
  return readStoredAccent() ?? "indigo";
}
