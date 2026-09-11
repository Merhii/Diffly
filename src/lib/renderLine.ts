import { highlightLine } from "./highlight";
import type { RenderedSegment, WordDiffSpan } from "../types";

/**
 * Split-then-highlight, not highlight-then-split: wrapping a <mark> around
 * an arbitrary slice of already-tokenized Prism HTML would produce malformed
 * tags, so each word-diff span is tokenized independently instead. Tradeoff:
 * a token straddling a span boundary may highlight slightly differently than
 * full-line tokenization would — a cosmetic edge case, not a bug.
 */
export function renderLineSegments(
  content: string,
  lang: string,
  spans: WordDiffSpan[] | null,
): RenderedSegment[] {
  if (!spans) {
    return [{ html: highlightLine(content, lang), changed: false }];
  }

  return spans.map((span) => ({
    html: highlightLine(span.text, lang),
    changed: span.changed,
  }));
}
