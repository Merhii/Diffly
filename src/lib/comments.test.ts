import { beforeEach, describe, expect, it } from "vitest";
import { hashDiffText, loadDiffRecord, writeDiffRecord } from "./comments";

// No DOM in this project's test environment — a minimal in-memory
// localStorage stand-in is enough to exercise the read/write logic.
function installFakeLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

installFakeLocalStorage();

describe("hashDiffText", () => {
  it("is stable for identical input", () => {
    expect(hashDiffText("diff --git a/x b/x")).toBe(hashDiffText("diff --git a/x b/x"));
  });

  it("differs for different input", () => {
    expect(hashDiffText("a")).not.toBe(hashDiffText("b"));
  });

  it("returns a fixed-width hex string", () => {
    expect(hashDiffText("")).toMatch(/^[0-9a-f]{8}$/);
    expect(hashDiffText("some longer diff text with several lines\n+added\n-removed")).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("loadDiffRecord / writeDiffRecord", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty record for an unknown diffId", () => {
    expect(loadDiffRecord("nope")).toEqual({ comments: {}, viewedFileIds: [] });
  });

  it("round-trips a written record", () => {
    const record = { comments: { "0-a:0:1": "check this" }, viewedFileIds: ["0-a"] };
    writeDiffRecord("abc123", record);
    expect(loadDiffRecord("abc123")).toEqual(record);
  });

  it("keeps records for different diffIds independent", () => {
    writeDiffRecord("id1", { comments: { k: "one" }, viewedFileIds: [] });
    writeDiffRecord("id2", { comments: { k: "two" }, viewedFileIds: ["f"] });
    expect(loadDiffRecord("id1").comments.k).toBe("one");
    expect(loadDiffRecord("id2").comments.k).toBe("two");
    expect(loadDiffRecord("id2").viewedFileIds).toEqual(["f"]);
  });

  it("overwrites a diffId's record on repeated writes", () => {
    writeDiffRecord("id1", { comments: { k: "one" }, viewedFileIds: [] });
    writeDiffRecord("id1", { comments: {}, viewedFileIds: ["f1", "f2"] });
    expect(loadDiffRecord("id1")).toEqual({ comments: {}, viewedFileIds: ["f1", "f2"] });
  });
});
