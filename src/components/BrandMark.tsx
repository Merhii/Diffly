interface BrandMarkProps {
  className?: string;
}

/**
 * The mark echoes the app's own diff gutter: a faded "removed" line (minus
 * tick + short bar) above a bold "added" line (plus tick + full bar) — the
 * same +/- vocabulary used throughout the diff view itself, not a generic
 * abstract glyph. Monochrome (currentColor) so it reads the same across all
 * accent presets and both themes.
 */
export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 7h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
      <rect x="9" y="5.7" width="12" height="2.6" rx="1.3" fill="currentColor" opacity="0.4" />
      <path d="M3 17.6h4M5 15.4v4.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="9" y="16.3" width="12" height="2.6" rx="1.3" fill="currentColor" />
    </svg>
  );
}
