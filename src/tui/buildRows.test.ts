import { describe, expect, it } from "vitest";
import { buildTuiRows, buildTuiSplitRows } from "./buildRows";
import type { DiffFile, ParsedDiff } from "../types";

function file(overrides: Partial<DiffFile>): DiffFile {
  return {
    id: overrides.id ?? "f1",
    oldPath: "a.ts",
    newPath: "a.ts",
    status: "modified",
    isBinary: false,
    additions: 0,
    deletions: 0,
    hunks: [],
    noNewlineAtEndOfFile: false,
    ...overrides,
  };
}

describe("buildTuiRows", () => {
  it("emits a file-header row per file, followed by hunk-header and line rows", () => {
    const diff: ParsedDiff = {
      files: [
        file({
          id: "f1",
          hunks: [
            {
              header: "@@ -1,1 +1,1 @@",
              oldStart: 1,
              oldLines: 1,
              newStart: 1,
              newLines: 1,
              lines: [{ type: "context", content: "same", oldLineNumber: 1, newLineNumber: 1 }],
            },
          ],
        }),
      ],
    };

    const rows = buildTuiRows(diff, new Set(), new Set(), new Map());
    expect(rows.map((r) => r.kind)).toEqual(["file-header", "hunk-header", "line"]);
    expect(rows[0]).toMatchObject({ kind: "file-header", fileId: "f1", collapsed: false });
    expect(rows[2]).toMatchObject({ kind: "line", type: "context", content: "same" });
  });

  it("skips a collapsed file's content rows but keeps its header", () => {
    const diff: ParsedDiff = {
      files: [
        file({
          id: "f1",
          hunks: [
            {
              header: "@@ -1,1 +1,1 @@",
              oldStart: 1,
              oldLines: 1,
              newStart: 1,
              newLines: 1,
              lines: [{ type: "context", content: "same", oldLineNumber: 1, newLineNumber: 1 }],
            },
          ],
        }),
      ],
    };

    const rows = buildTuiRows(diff, new Set(["f1"]), new Set(), new Map());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "file-header", fileId: "f1", collapsed: true });
  });

  it("renders a binary placeholder row instead of hunks for a binary file", () => {
    const diff: ParsedDiff = { files: [file({ id: "f1", isBinary: true })] };
    const rows = buildTuiRows(diff, new Set(), new Set(), new Map());
    expect(rows.map((r) => r.kind)).toEqual(["file-header", "binary"]);
  });

  it("carries viewed status onto the file-header row", () => {
    const diff: ParsedDiff = { files: [file({ id: "f1" })] };
    const rows = buildTuiRows(diff, new Set(), new Set(["f1"]), new Map());
    expect(rows[0]).toMatchObject({ kind: "file-header", viewed: true });
  });

  it("attaches moveInfo to a del/add row whose lineKey is in the moveLookup", () => {
    const diff: ParsedDiff = {
      files: [
        file({
          id: "f1",
          hunks: [
            {
              header: "@@ -1,1 +1,1 @@",
              oldStart: 1,
              oldLines: 0,
              newStart: 1,
              newLines: 1,
              lines: [{ type: "add", content: "moved line", oldLineNumber: null, newLineNumber: 1 }],
            },
          ],
        }),
      ],
    };
    const key = "f1:0:0";
    const moveLookup = new Map([[key, { counterpartKeys: ["other:0:0"], lineCount: 1, isFirstInRun: true }]]);

    const rows = buildTuiRows(diff, new Set(), new Set(), moveLookup);
    const lineRow = rows.find((r) => r.kind === "line");
    expect(lineRow).toMatchObject({ matchKey: key, moveInfo: { isFirstInRun: true, lineCount: 1 } });
  });
});

describe("buildTuiSplitRows", () => {
  const diff: ParsedDiff = {
    files: [
      file({
        id: "f1",
        hunks: [
          {
            header: "@@ -1,2 +1,2 @@",
            oldStart: 1,
            oldLines: 2,
            newStart: 1,
            newLines: 2,
            lines: [
              { type: "del", content: "old line", oldLineNumber: 1, newLineNumber: null },
              { type: "add", content: "new line", oldLineNumber: null, newLineNumber: 1 },
              { type: "context", content: "same line", oldLineNumber: 2, newLineNumber: 2 },
            ],
          },
        ],
      }),
    ],
  };

  it("pairs a modify-pair into one row with both sides populated", () => {
    const rows = buildTuiSplitRows(diff, new Set(), new Set(), new Map());
    const modifyRow = rows.find((r) => r.kind === "split-line" && r.left?.type === "del");
    expect(modifyRow).toMatchObject({
      kind: "split-line",
      left: { content: "old line", type: "del" },
      right: { content: "new line", type: "add" },
    });
  });

  it("puts the same line on both sides for a context row", () => {
    const rows = buildTuiSplitRows(diff, new Set(), new Set(), new Map());
    const contextRow = rows.find((r) => r.kind === "split-line" && r.left?.type === "context");
    expect(contextRow).toMatchObject({
      left: { content: "same line" },
      right: { content: "same line" },
    });
  });

  it("skips a collapsed file's content rows but keeps its header", () => {
    const rows = buildTuiSplitRows(diff, new Set(["f1"]), new Set(), new Map());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "file-header", collapsed: true });
  });
});
