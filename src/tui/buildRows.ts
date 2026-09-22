import type { MoveCounterpart } from "../lib/moveLookup";
import { lineKey } from "../lib/lineKey";
import { pairHunkLines } from "../lib/pairLines";
import { computeWordDiff } from "../lib/wordDiff";
import type { DiffFile, FileChangeStatus, LineType, ParsedDiff, WordDiffSpan } from "../types";

export type TuiRow =
  | {
      kind: "file-header";
      fileId: string;
      label: string;
      status: FileChangeStatus;
      additions: number;
      deletions: number;
      viewed: boolean;
      collapsed: boolean;
    }
  | { kind: "hunk-header"; fileId: string; header: string }
  | { kind: "binary"; fileId: string }
  | {
      kind: "line";
      fileId: string;
      matchKey: string;
      type: LineType;
      content: string;
      oldLineNumber: number | null;
      newLineNumber: number | null;
      spans: WordDiffSpan[] | null;
      moveInfo: MoveCounterpart | null;
    };

function fileLabel(file: DiffFile): string {
  return file.newPath ?? file.oldPath ?? "unknown file";
}

/**
 * Flattens a ParsedDiff into a single ordered list of rows the terminal UI
 * scrolls through — one continuous list across every file, mirroring the
 * browser's single-scroll-container layout (rather than a per-file pager),
 * so collapse/expand and cursor movement behave the same way conceptually.
 * Pure and Ink-agnostic so it can be unit tested like the rest of lib/.
 */
export function buildTuiRows(
  diff: ParsedDiff,
  collapsedFileIds: Set<string>,
  viewedFileIds: Set<string>,
  moveLookup: Map<string, MoveCounterpart>,
): TuiRow[] {
  const rows: TuiRow[] = [];

  for (const file of diff.files) {
    const collapsed = collapsedFileIds.has(file.id);
    rows.push({
      kind: "file-header",
      fileId: file.id,
      label: fileLabel(file),
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      viewed: viewedFileIds.has(file.id),
      collapsed,
    });

    if (collapsed) continue;

    if (file.isBinary) {
      rows.push({ kind: "binary", fileId: file.id });
      continue;
    }

    file.hunks.forEach((hunk, hunkIndex) => {
      rows.push({ kind: "hunk-header", fileId: file.id, header: hunk.header });

      for (const pairedRow of pairHunkLines(hunk.lines)) {
        if (pairedRow.kind === "context" && pairedRow.left) {
          const key = lineKey(file.id, hunkIndex, pairedRow.left, hunk.lines);
          rows.push({
            kind: "line",
            fileId: file.id,
            matchKey: key,
            type: "context",
            content: pairedRow.left.content,
            oldLineNumber: pairedRow.left.oldLineNumber,
            newLineNumber: pairedRow.left.newLineNumber,
            spans: null,
            moveInfo: null,
          });
          continue;
        }

        const wordDiff =
          pairedRow.kind === "modify-pair" && pairedRow.left && pairedRow.right
            ? computeWordDiff(pairedRow.left.content, pairedRow.right.content)
            : null;

        if (pairedRow.left) {
          const key = lineKey(file.id, hunkIndex, pairedRow.left, hunk.lines);
          rows.push({
            kind: "line",
            fileId: file.id,
            matchKey: key,
            type: "del",
            content: pairedRow.left.content,
            oldLineNumber: pairedRow.left.oldLineNumber,
            newLineNumber: null,
            spans: wordDiff?.oldSpans ?? null,
            moveInfo: moveLookup.get(key) ?? null,
          });
        }

        if (pairedRow.right) {
          const key = lineKey(file.id, hunkIndex, pairedRow.right, hunk.lines);
          rows.push({
            kind: "line",
            fileId: file.id,
            matchKey: key,
            type: "add",
            content: pairedRow.right.content,
            oldLineNumber: null,
            newLineNumber: pairedRow.right.newLineNumber,
            spans: wordDiff?.newSpans ?? null,
            moveInfo: moveLookup.get(key) ?? null,
          });
        }
      }
    });
  }

  return rows;
}
