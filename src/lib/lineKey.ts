import type { DiffLine } from "../types";

/**
 * Stable per-line identity used to address a specific line across search,
 * comments, and (now) operation detection — must stay identical everywhere
 * a line needs to be referenced, since consumers match on this string.
 */
export function lineKey(fileId: string, hunkIndex: number, line: DiffLine, hunkLines: DiffLine[]): string {
  return `${fileId}:${hunkIndex}:${hunkLines.indexOf(line)}`;
}
