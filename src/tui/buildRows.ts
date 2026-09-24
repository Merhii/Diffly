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

export interface TuiSplitSide {
  matchKey: string;
  type: LineType;
  content: string;
  lineNumber: number | null;
  spans: WordDiffSpan[] | null;
  moveInfo: MoveCounterpart | null;
}

export type TuiSplitRow =
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
  | { kind: "split-line"; fileId: string; left: TuiSplitSide | null; right: TuiSplitSide | null };

function fileLabel(file: DiffFile): string {
  return file.newPath ?? file.oldPath ?? "unknown file";
}

/**
 * Flattens a ParsedDiff into a single ordered list of rows the terminal UI
 * scrolls through — one continuous list across every file rather than a
 * per-file pager, so the cursor moves through the whole diff uninterrupted
 * and a collapsed file simply contributes fewer rows.
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

/**
 * Same flattening as buildTuiRows, but pairing each del with its
 * corresponding add instead of listing them sequentially — one row per
 * pairHunkLines result, each side rendered in its own terminal column.
 */
export function buildTuiSplitRows(
  diff: ParsedDiff,
  collapsedFileIds: Set<string>,
  viewedFileIds: Set<string>,
  moveLookup: Map<string, MoveCounterpart>,
): TuiSplitRow[] {
  const rows: TuiSplitRow[] = [];

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
        const wordDiff =
          pairedRow.kind === "modify-pair" && pairedRow.left && pairedRow.right
            ? computeWordDiff(pairedRow.left.content, pairedRow.right.content)
            : null;
        const leftType: LineType = pairedRow.kind === "context" ? "context" : "del";
        const rightType: LineType = pairedRow.kind === "context" ? "context" : "add";

        const left: TuiSplitSide | null = pairedRow.left
          ? {
              matchKey: lineKey(file.id, hunkIndex, pairedRow.left, hunk.lines),
              type: leftType,
              content: pairedRow.left.content,
              lineNumber: pairedRow.left.oldLineNumber,
              spans: wordDiff?.oldSpans ?? null,
              moveInfo: moveLookup.get(lineKey(file.id, hunkIndex, pairedRow.left, hunk.lines)) ?? null,
            }
          : null;

        const right: TuiSplitSide | null = pairedRow.right
          ? {
              matchKey: lineKey(file.id, hunkIndex, pairedRow.right, hunk.lines),
              type: rightType,
              content: pairedRow.right.content,
              lineNumber: pairedRow.right.newLineNumber,
              spans: wordDiff?.newSpans ?? null,
              moveInfo: moveLookup.get(lineKey(file.id, hunkIndex, pairedRow.right, hunk.lines)) ?? null,
            }
          : null;

        rows.push({ kind: "split-line", fileId: file.id, left, right });
      }
    });
  }

  return rows;
}
