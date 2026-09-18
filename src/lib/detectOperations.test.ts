import { describe, expect, it } from "vitest";
import { detectOperations } from "./detectOperations";
import type { DiffFile, DiffHunk, DiffLine, ParsedDiff } from "../types";

function line(type: DiffLine["type"], content: string): DiffLine {
  return { type, content, oldLineNumber: null, newLineNumber: null };
}

function hunk(lines: DiffLine[]): DiffHunk {
  return { header: "", oldStart: 1, oldLines: 0, newStart: 1, newLines: 0, lines };
}

function file(id: string, hunks: DiffHunk[]): DiffFile {
  return {
    id,
    oldPath: `${id}.ts`,
    newPath: `${id}.ts`,
    status: "modified",
    isBinary: false,
    additions: 0,
    deletions: 0,
    hunks,
    noNewlineAtEndOfFile: false,
  };
}

function diffOf(...files: DiffFile[]): ParsedDiff {
  return { files };
}

describe("detectOperations — moves", () => {
  it("detects a block of lines deleted in one hunk and re-added, unchanged, in another", () => {
    const diff = diffOf(
      file("f1", [
        hunk([line("del", "function longEnoughToCountAsAMove() {"), line("del", "  return 1;"), line("del", "}")]),
        hunk([
          line("context", "// unrelated"),
          line("add", "function longEnoughToCountAsAMove() {"),
          line("add", "  return 1;"),
          line("add", "}"),
        ]),
      ]),
    );

    const { moves } = detectOperations(diff);
    expect(moves).toHaveLength(1);
    expect(moves[0].lineCount).toBe(3);
    expect(moves[0].fromKeys).toEqual(["f1:0:0", "f1:0:1", "f1:0:2"]);
    expect(moves[0].toKeys).toEqual(["f1:1:1", "f1:1:2", "f1:1:3"]);
  });

  it("detects a single moved line long enough to be distinctive", () => {
    const diff = diffOf(
      file("f1", [
        hunk([line("del", "const uniqueDistinctiveIdentifier = 42;")]),
        hunk([line("add", "const uniqueDistinctiveIdentifier = 42;")]),
      ]),
    );
    expect(detectOperations(diff).moves).toHaveLength(1);
  });

  it("does not flag short/common lines as moves", () => {
    const diff = diffOf(
      file("f1", [hunk([line("del", "}"), line("del", "}")]), hunk([line("add", "}"), line("add", "}")])]),
    );
    expect(detectOperations(diff).moves).toHaveLength(0);
  });

  it("does not flag a genuine deletion with no matching addition anywhere", () => {
    const diff = diffOf(
      file("f1", [hunk([line("del", "this content appears nowhere else in the diff at all")])]),
    );
    expect(detectOperations(diff).moves).toHaveLength(0);
  });

  it("does not match the same added run to two different deleted runs", () => {
    const content = "duplicated block that appears as a deletion twice";
    const diff = diffOf(
      file("f1", [
        hunk([line("del", content)]),
        hunk([line("del", content)]),
        hunk([line("add", content)]),
      ]),
    );
    // Only one add run exists, so only one of the two identical deletions
    // can legitimately be "the" move — the other is just a deletion.
    expect(detectOperations(diff).moves).toHaveLength(1);
  });

  it("does not confuse a same-content del/add pair across different files", () => {
    const content = "this line is identical in both files but that's not a move";
    const diff = diffOf(
      file("f1", [hunk([line("del", content)])]),
      file("f2", [hunk([line("add", content)])]),
    );
    // Same-file only for this round, per the plan.
    expect(detectOperations(diff).moves).toHaveLength(0);
  });
});

describe("detectOperations — updates", () => {
  it("produces an update for a clean 1:1 modified line pair", () => {
    const diff = diffOf(file("f1", [hunk([line("del", "return user.getName();"), line("add", "return user.getFullName();")])]));
    const { updates } = detectOperations(diff);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({ type: "update", delKey: "f1:0:0", addKey: "f1:0:1" });
  });

  it("does not produce an update for a near-total rewrite", () => {
    const diff = diffOf(file("f1", [hunk([line("del", "foo bar"), line("add", "completely different")])]));
    expect(detectOperations(diff).updates).toHaveLength(0);
  });

  it("does not produce an update for a 2:2 replace block", () => {
    const diff = diffOf(
      file("f1", [hunk([line("del", "old1"), line("del", "old2"), line("add", "new1"), line("add", "new2")])]),
    );
    expect(detectOperations(diff).updates).toHaveLength(0);
  });
});

describe("detectOperations — find/replace", () => {
  function renamedServiceHunk(n: number): DiffHunk {
    return hunk([line("del", `oldService.call${n}();`), line("add", `newService.call${n}();`)]);
  }

  it("detects the same substitution recurring across 3+ modified lines", () => {
    const diff = diffOf(file("f1", [renamedServiceHunk(1), renamedServiceHunk(2), renamedServiceHunk(3)]));
    const { findReplaces } = detectOperations(diff);
    expect(findReplaces).toHaveLength(1);
    expect(findReplaces[0].oldText).toBe("oldService");
    expect(findReplaces[0].newText).toBe("newService");
    expect(findReplaces[0].occurrences).toHaveLength(3);
  });

  it("does not flag a substitution recurring only twice", () => {
    const diff = diffOf(file("f1", [renamedServiceHunk(1), renamedServiceHunk(2)]));
    expect(detectOperations(diff).findReplaces).toHaveLength(0);
  });

  it("aggregates occurrences across multiple files", () => {
    const diff = diffOf(
      file("f1", [renamedServiceHunk(1)]),
      file("f2", [renamedServiceHunk(2)]),
      file("f3", [renamedServiceHunk(3)]),
    );
    expect(detectOperations(diff).findReplaces).toHaveLength(1);
  });

  it("excludes lines with more than one changed span from find/replace grouping", () => {
    // Two separate substitutions on an otherwise mostly-shared line — not a
    // clean single old->new pair, so it must not pollute a find/replace
    // group, even though it still counts as a plain update (enough shared
    // surrounding text to clear wordDiff's similarity threshold).
    const messyHunk = hunk([
      line("del", "  const result = oldService.oldMethod(a, b, c);"),
      line("add", "  const result = newService.newMethod(a, b, c);"),
    ]);
    const diff = diffOf(file("f1", [messyHunk, renamedServiceHunk(1), renamedServiceHunk(2)]));
    const { findReplaces, updates } = detectOperations(diff);
    expect(findReplaces).toHaveLength(0); // only 2 clean occurrences, below the threshold of 3
    expect(updates.length).toBeGreaterThanOrEqual(3);
  });
});
