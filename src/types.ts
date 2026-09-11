export type LineType = "add" | "del" | "context";

export interface DiffLine {
  type: LineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export type FileChangeStatus = "added" | "deleted" | "modified" | "renamed";

export interface DiffFile {
  id: string;
  oldPath: string | null;
  newPath: string | null;
  status: FileChangeStatus;
  isBinary: boolean;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  noNewlineAtEndOfFile: boolean;
}

export interface ParsedDiff {
  files: DiffFile[];
}

export type ViewMode = "unified" | "split";
export type Theme = "light" | "dark";

export interface SideBySideRow {
  left: DiffLine | null;
  right: DiffLine | null;
  kind: "context" | "add" | "del" | "modify-pair" | "replace";
}

export interface WordDiffSpan {
  text: string;
  changed: boolean;
}

export interface WordDiffResult {
  oldSpans: WordDiffSpan[];
  newSpans: WordDiffSpan[];
}

export interface RenderedSegment {
  html: string;
  changed: boolean;
}

export interface SearchMatch {
  fileId: string;
  kind: "filename" | "line";
  hunkIndex?: number;
  lineIndexInHunk?: number;
}
