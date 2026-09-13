interface BrandMarkProps {
  className?: string;
}

/**
 * Two overlapping chips — a "removed" one with a minus, an "added" one with
 * a plus — a literal diff rather than an abstract glyph. Fills are bound to
 * the app's own diff-add/diff-del tokens, so the mark doubles as a live
 * preview of whichever accent preset and theme is active. Glyph strokes use
 * accent-contrast, which already flips white-on-dark-chip (light mode) vs
 * dark-on-bright-chip (dark mode) for exactly this purpose.
 */
export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="9" width="14" height="14" rx="4" fill="var(--color-diff-del-text)" />
      <rect x="9" y="1" width="14" height="14" rx="4" fill="var(--color-diff-add-text)" />
      <line x1="4" y1="16.5" x2="8" y2="16.5" stroke="var(--color-accent-contrast)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="4.5" x2="18" y2="9.5" stroke="var(--color-accent-contrast)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15.5" y1="7" x2="20.5" y2="7" stroke="var(--color-accent-contrast)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
