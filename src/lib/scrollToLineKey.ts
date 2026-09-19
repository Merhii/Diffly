/**
 * Jumps to a specific line by its lineKey, reusing the same
 * `data-match-key` attribute the search feature already scrolls to
 * (see App.tsx) — one addressing scheme, multiple features hook into it.
 */
export function scrollToLineKey(key: string): void {
  document.querySelector(`[data-match-key="${key}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
}
