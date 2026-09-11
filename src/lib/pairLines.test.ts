import { describe, expect, it } from "vitest";
import { pairHunkLines } from "./pairLines";
import type { DiffLine } from "../types";

function line(type: DiffLine["type"], content: string): DiffLine {
  return { type, content, oldLineNumber: null, newLineNumber: null };
}

describe("pairHunkLines", () => {
  it("passes context lines through unpaired", () => {
    const rows = pairHunkLines([line("context", "a"), line("context", "b")]);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.kind === "context")).toBe(true);
    expect(rows[0].left).toBe(rows[0].right);
  });

  it("pairs a pure addition run with blank left cells", () => {
    const rows = pairHunkLines([line("add", "x"), line("add", "y")]);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.kind === "add" && row.left === null)).toBe(true);
  });

  it("pairs a pure deletion run with blank right cells", () => {
    const rows = pairHunkLines([line("del", "x"), line("del", "y")]);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.kind === "del" && row.right === null)).toBe(true);
  });

  it("marks a clean 1:1 del/add pair as modify-pair", () => {
    const rows = pairHunkLines([line("del", "old"), line("add", "new")]);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("modify-pair");
    expect(rows[0].left?.content).toBe("old");
    expect(rows[0].right?.content).toBe("new");
  });

  it("marks a 2:2 block as replace, not modify-pair", () => {
    const rows = pairHunkLines([
      line("del", "old1"),
      line("del", "old2"),
      line("add", "new1"),
      line("add", "new2"),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.kind === "replace")).toBe(true);
  });

  it("pads uneven runs with blank cells on the shorter side", () => {
    const rows = pairHunkLines([
      line("del", "old1"),
      line("del", "old2"),
      line("del", "old3"),
      line("add", "new1"),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0].kind).toBe("replace");
    expect(rows[0].right?.content).toBe("new1");
    expect(rows[1].kind).toBe("del");
    expect(rows[1].right).toBeNull();
    expect(rows[2].kind).toBe("del");
    expect(rows[2].right).toBeNull();
  });

  it("handles interleaved context/del/add sequences", () => {
    const rows = pairHunkLines([
      line("context", "ctx1"),
      line("del", "old"),
      line("add", "new"),
      line("context", "ctx2"),
    ]);
    expect(rows.map((row) => row.kind)).toEqual(["context", "modify-pair", "context"]);
  });
});
