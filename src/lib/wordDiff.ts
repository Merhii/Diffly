import { diffWordsWithSpace } from "diff";
import type { WordDiffResult, WordDiffSpan } from "../types";

// Below this fraction of shared content, word-diffing a near-total rewrite
// just fragments the line into noisy alternating spans — plain add/del
// (the null case) reads better than "highlighting" almost the whole line.
const MIN_SIMILARITY = 0.25;

/**
 * Word-level diff for a single modified line pair. Uses diffWordsWithSpace
 * (not diffWords) so whitespace-only changes are still detected as changes.
 * Returns null when the lines are too dissimilar for word-level highlighting
 * to be useful (see MIN_SIMILARITY) — callers fall back to plain line coloring.
 */
export function computeWordDiff(oldLine: string, newLine: string): WordDiffResult | null {
  const parts = diffWordsWithSpace(oldLine, newLine);
  const oldSpans: WordDiffSpan[] = [];
  const newSpans: WordDiffSpan[] = [];
  let unchangedLength = 0;

  for (const part of parts) {
    if (part.removed) {
      oldSpans.push({ text: part.value, changed: true });
    } else if (part.added) {
      newSpans.push({ text: part.value, changed: true });
    } else {
      oldSpans.push({ text: part.value, changed: false });
      newSpans.push({ text: part.value, changed: false });
      unchangedLength += part.value.length;
    }
  }

  const longestLength = Math.max(oldLine.length, newLine.length, 1);
  if (unchangedLength / longestLength < MIN_SIMILARITY) {
    return null;
  }

  return { oldSpans, newSpans };
}
