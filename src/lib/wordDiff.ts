import { diffWordsWithSpace } from "diff";
import type { WordDiffResult, WordDiffSpan } from "../types";

/**
 * Word-level diff for a single modified line pair. Uses diffWordsWithSpace
 * (not diffWords) so whitespace-only changes are still detected as changes.
 */
export function computeWordDiff(oldLine: string, newLine: string): WordDiffResult {
  const parts = diffWordsWithSpace(oldLine, newLine);
  const oldSpans: WordDiffSpan[] = [];
  const newSpans: WordDiffSpan[] = [];

  for (const part of parts) {
    if (part.removed) {
      oldSpans.push({ text: part.value, changed: true });
    } else if (part.added) {
      newSpans.push({ text: part.value, changed: true });
    } else {
      oldSpans.push({ text: part.value, changed: false });
      newSpans.push({ text: part.value, changed: false });
    }
  }

  return { oldSpans, newSpans };
}
