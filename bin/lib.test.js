import { describe, expect, it } from "vitest";
import { resolveDiffInput } from "./lib.js";


describe("resolveDiffInput", () => {
  it("prefers an explicit file path over everything else", () => {
    const result = resolveDiffInput({
      argPath: "some.diff",
      isTTY: false,
      readFile: (path) => `content of ${path}`,
      readStdin: () => {
        throw new Error("should not read stdin when a path is given");
      },
      execGit: () => {
        throw new Error("should not call git when a path is given");
      },
    });
    expect(result).toEqual({ ok: true, text: "content of some.diff", source: "some.diff" });
  });

  it("reports a clean error instead of throwing when the file path doesn't exist", () => {
    const result = resolveDiffInput({
      argPath: "nope.diff",
      isTTY: true,
      readFile: () => {
        throw new Error("ENOENT: no such file or directory, open 'nope.diff'");
      },
      readStdin: () => {
        throw new Error("should not read stdin when a path is given");
      },
      execGit: () => {
        throw new Error("should not call git when a path is given");
      },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("nope.diff");
    expect(result.error).toContain("ENOENT");
  });

  it("reports an error instead of loading an empty file path", () => {
    const result = resolveDiffInput({
      argPath: "empty.diff",
      isTTY: true,
      readFile: () => "   \n  ",
      readStdin: () => {
        throw new Error("should not read stdin when a path is given");
      },
      execGit: () => {
        throw new Error("should not call git when a path is given");
      },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/empty\.diff.*empty/i);
  });

  it("reports an error instead of loading empty piped stdin", () => {
    const result = resolveDiffInput({
      argPath: undefined,
      isTTY: false,
      readFile: () => {
        throw new Error("should not read a file");
      },
      readStdin: () => "   ",
      execGit: () => {
        throw new Error("should not call git when stdin is piped");
      },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/stdin/i);
  });

  it("reads stdin when piped and no path is given", () => {
    const result = resolveDiffInput({
      argPath: undefined,
      isTTY: false,
      readFile: () => {
        throw new Error("should not read a file");
      },
      readStdin: () => "piped diff text",
      execGit: () => {
        throw new Error("should not call git when stdin is piped");
      },
    });
    expect(result).toEqual({ ok: true, text: "piped diff text", source: "stdin" });
  });

  it("falls back to `git diff` when no path or pipe", () => {
    const result = resolveDiffInput({
      argPath: undefined,
      isTTY: true,
      readFile: () => {
        throw new Error("no file expected");
      },
      readStdin: () => {
        throw new Error("no stdin expected");
      },
      execGit: (args) => (args.join(" ") === "diff" ? "unstaged changes here" : ""),
    });
    expect(result).toEqual({ ok: true, text: "unstaged changes here", source: "git diff" });
  });

  it("falls back to `git diff --staged` when unstaged is empty", () => {
    const result = resolveDiffInput({
      argPath: undefined,
      isTTY: true,
      readFile: () => "",
      readStdin: () => "",
      execGit: (args) => (args.join(" ") === "diff --staged" ? "staged changes here" : ""),
    });
    expect(result).toEqual({ ok: true, text: "staged changes here", source: "git diff --staged" });
  });

  it("reports no changes when everything is empty", () => {
    const result = resolveDiffInput({
      argPath: undefined,
      isTTY: true,
      readFile: () => "",
      readStdin: () => "",
      execGit: () => "",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/No changes found/);
  });

  it("treats a whitespace-only git diff as empty and keeps falling back", () => {
    const result = resolveDiffInput({
      argPath: undefined,
      isTTY: true,
      readFile: () => "",
      readStdin: () => "",
      execGit: (args) => (args.join(" ") === "diff" ? "   \n  " : ""),
    });
    expect(result.ok).toBe(false);
  });
});

