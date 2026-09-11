import type { ParsedDiff, SearchMatch } from "../types";

export function buildSearchMatches(
  diff: ParsedDiff,
  query: string,
  includeFilenames: boolean,
): SearchMatch[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const needle = trimmed.toLowerCase();
  const matches: SearchMatch[] = [];

  for (const file of diff.files) {
    if (includeFilenames) {
      const path = file.newPath ?? file.oldPath ?? "";
      if (path.toLowerCase().includes(needle)) {
        matches.push({ fileId: file.id, kind: "filename" });
      }
    }

    file.hunks.forEach((hunk, hunkIndex) => {
      hunk.lines.forEach((line, lineIndexInHunk) => {
        if (line.content.toLowerCase().includes(needle)) {
          matches.push({ fileId: file.id, kind: "line", hunkIndex, lineIndexInHunk });
        }
      });
    });
  }

  return matches;
}
