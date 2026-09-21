import { describe, expect, it } from "vitest";
import { injectDiffIntoHtml, resolveDiffInput } from "./lib.js";

const HTML_FIXTURE = `<!doctype html>
<html>
  <head>
    <script type="module" crossorigin src="/assets/index-abc123.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js"></script>
  </body>
</html>`;

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

describe("injectDiffIntoHtml", () => {
  it("injects a script assigning window.__DIFFLY_PRELOADED_DIFF__ before the app entry script", () => {
    const result = injectDiffIntoHtml(HTML_FIXTURE, "diff --git a/x b/x\n+hello");
    expect(result).toContain('window.__DIFFLY_PRELOADED_DIFF__ = "diff --git a/x b/x\\n+hello";');

    const injectedIndex = result.indexOf("__DIFFLY_PRELOADED_DIFF__");
    const appEntryIndex = result.indexOf('src="/assets/index-abc123.js"');
    const analyticsIndex = result.indexOf("cloudflareinsights");
    expect(injectedIndex).toBeGreaterThan(-1);
    expect(injectedIndex).toBeLessThan(appEntryIndex);
    // must not have injected before the analytics script instead — that one
    // is also type="module" but is not the app's own bundle
    expect(appEntryIndex).toBeLessThan(analyticsIndex);
  });

  it("throws a clear error when the app entry script can't be found", () => {
    expect(() => injectDiffIntoHtml("<html><body>no scripts here</body></html>", "text")).toThrow(
      /Could not find the app's bundled entry script/,
    );
  });

  it("does not let diff content prematurely close the injected script tag", () => {
    const adversarial = 'a</script><script>alert(1)</script>b "quotes" `backticks` \\backslash';
    const result = injectDiffIntoHtml(HTML_FIXTURE, adversarial);

    // the line has exactly one *real* closing tag (the one that legitimately
    // closes our injected <script> element) — every other "</script"
    // contributed by the diff content itself must have been neutralized
    const assignmentLine = result.split("\n").find((line) => line.includes("__DIFFLY_PRELOADED_DIFF__"));
    expect(assignmentLine).toBeDefined();
    expect(assignmentLine).toMatch(/<\/script>$/);
    const withoutOwnClosingTag = assignmentLine.replace(/<\/script>$/, "");
    expect(withoutOwnClosingTag.match(/<\/script/gi)).toBeNull();
    expect(assignmentLine).toContain("<\\/script");

    // and the value must still round-trip correctly once a JS engine would
    // un-escape `\/` back to `/` (JSON.parse doesn't do that step itself, so
    // simulate it the same way a <script> tag's JS parser would before the
    // string literal ever reaches JSON logic)
    const literalMatch = assignmentLine.match(/window\.__DIFFLY_PRELOADED_DIFF__ = (".*");/);
    expect(literalMatch).not.toBeNull();
    const jsUnescaped = literalMatch[1].replace(/\\\//g, "/");
    expect(JSON.parse(jsUnescaped)).toBe(adversarial);
  });
});
