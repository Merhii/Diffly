import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDiffText } from "./parseDiff";

const dirname = fileURLToPath(new URL(".", import.meta.url));

function loadFixture(name: string): string {
  return readFileSync(resolve(dirname, "../../fixtures", name), "utf-8");
}

describe("parseDiffText", () => {
  it("parses an added file", () => {
    const diff = parseDiffText(loadFixture("added-file.diff"));
    expect(diff.files).toHaveLength(1);
    const [file] = diff.files;
    expect(file.status).toBe("added");
    expect(file.oldPath).toBeNull();
    expect(file.newPath).toBe("src/greet.ts");
    expect(file.isBinary).toBe(false);
    expect(file.hunks[0].lines.every((line) => line.type === "add")).toBe(true);
    expect(file.hunks[0].lines.every((line) => line.oldLineNumber === null)).toBe(true);
    expect(file.additions).toBe(5);
    expect(file.deletions).toBe(0);
  });

  it("parses a deleted file", () => {
    const diff = parseDiffText(loadFixture("deleted-file.diff"));
    const [file] = diff.files;
    expect(file.status).toBe("deleted");
    expect(file.oldPath).toBe("src/legacy.ts");
    expect(file.newPath).toBeNull();
    expect(file.hunks[0].lines.every((line) => line.type === "del")).toBe(true);
    expect(file.hunks[0].lines.every((line) => line.newLineNumber === null)).toBe(true);
  });

  it("parses a modified file with two hunks, stripping the diff marker char", () => {
    const diff = parseDiffText(loadFixture("modified-file.diff"));
    const [file] = diff.files;
    expect(file.status).toBe("modified");
    expect(file.hunks).toHaveLength(2);

    const firstHunkLines = file.hunks[0].lines;
    const delLine = firstHunkLines.find((line) => line.type === "del");
    const addLine = firstHunkLines.find((line) => line.type === "add");
    expect(delLine?.content).toBe("  return a + b;");
    expect(addLine?.content).toBe("  return a + b + 0;");

    const contextLine = firstHunkLines.find((line) => line.type === "context");
    expect(contextLine?.content.startsWith(" ")).toBe(false);

    const secondHunkDels = file.hunks[1].lines.filter((line) => line.type === "del");
    const secondHunkAdds = file.hunks[1].lines.filter((line) => line.type === "add");
    expect(secondHunkDels).toHaveLength(2);
    expect(secondHunkAdds).toHaveLength(2);
  });

  it("parses a pure rename with no hunks", () => {
    const diff = parseDiffText(loadFixture("renamed-file.diff"));
    const [file] = diff.files;
    expect(file.status).toBe("renamed");
    expect(file.oldPath).toBe("src/utils/format.ts");
    expect(file.newPath).toBe("src/utils/formatting.ts");
    expect(file.hunks).toHaveLength(0);
  });

  it("flags a binary file and produces no hunks", () => {
    const diff = parseDiffText(loadFixture("binary-file.diff"));
    const [file] = diff.files;
    expect(file.isBinary).toBe(true);
    expect(file.hunks).toHaveLength(0);
  });

  it("detects a missing trailing newline without leaking the marker into content", () => {
    const diff = parseDiffText(loadFixture("no-trailing-newline.diff"));
    const [file] = diff.files;
    expect(file.noNewlineAtEndOfFile).toBe(true);
    const allContent = file.hunks.flatMap((hunk) => hunk.lines.map((line) => line.content));
    expect(allContent.some((content) => content.includes("No newline"))).toBe(false);
  });

  it("parses a multi-file diff into independent files", () => {
    const diff = parseDiffText(loadFixture("mixed-multi-file.diff"));
    expect(diff.files.length).toBeGreaterThanOrEqual(4);
    const statuses = diff.files.map((file) => file.status);
    expect(statuses).toContain("added");
    expect(statuses).toContain("deleted");
    expect(statuses).toContain("modified");
    expect(statuses).toContain("renamed");
  });
});
