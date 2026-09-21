import type { DiffLine } from "../types";

/**
 * Stable per-line identity used to address a specific line across search,
 * comments, and (now) operation detection — must stay identical everywhere
 * a line needs to be referenced, since consumers match on this string.
 */
export function lineKey(fileId: string, hunkIndex: number, line: DiffLine, hunkLines: DiffLine[]): string {
  return `${fileId}:${hunkIndex}:${hunkLines.indexOf(line)}`;
}

/**
 * Recovers the fileId a lineKey was built from — the inverse of lineKey's
 * last two segments (hunkIndex, lineIndexInHunk are always numeric; the
 * fileId is everything before that, in case it ever contains a colon).
 */
export function fileIdFromLineKey(key: string): string {
  return key.split(":").slice(0, -2).join(":");
}
