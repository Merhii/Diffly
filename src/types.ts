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

export interface DiffRecord {
  comments: Record<string, string>;
  viewedFileIds: string[];
}

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


export interface SearchMatch {
  fileId: string;
  kind: "filename" | "line";
  hunkIndex?: number;
  lineIndexInHunk?: number;
}

/** A contiguous block of lines deleted in one place and re-added, unchanged, elsewhere. */
export interface MoveOperation {
  type: "move";
  fromKeys: string[];
  toKeys: string[];
  lineCount: number;
}

/** The same substring substitution recurring across 3+ modified lines in the diff. */
export interface FindReplaceOperation {
  type: "find-replace";
  oldText: string;
  newText: string;
  occurrences: { delKey: string; addKey: string }[];
}

/** A 1:1 modified line pair with a real word-diff — already computed by pairLines/wordDiff, surfaced here for a consistent operations API. */
export interface UpdateOperation {
  type: "update";
  delKey: string;
  addKey: string;
}

export interface DetectedOperations {
  moves: MoveOperation[];
  findReplaces: FindReplaceOperation[];
  updates: UpdateOperation[];
}
