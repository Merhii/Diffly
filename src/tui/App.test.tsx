import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import type { ParsedDiff } from "../types";
import App from "./App";

// Persistence goes through the real filesystem in production (diffStore.ts
// writes to ~/.diffly/state.json) — stubbed here so these tests stay
// hermetic and don't touch the machine running them.
vi.mock("../lib/diffStore", () => ({
  hashDiffText: vi.fn(() => "testhash"),
  writeDiffRecord: vi.fn(),
  loadDiffRecord: vi.fn(() => ({ comments: {}, viewedFileIds: [] })),
}));

const diff: ParsedDiff = {
  files: [
    {
      id: "f1",
      oldPath: "src/a.ts",
      newPath: "src/a.ts",
      status: "modified",
      isBinary: false,
      additions: 1,
      deletions: 1,
      noNewlineAtEndOfFile: false,
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
    },
    {
      id: "f2",
      oldPath: null,
      newPath: "src/b.ts",
      status: "added",
      isBinary: false,
      additions: 1,
      deletions: 0,
      noNewlineAtEndOfFile: false,
      hunks: [
        {
          header: "@@ -0,0 +1,1 @@",
          oldStart: 0,
          oldLines: 0,
          newStart: 1,
          newLines: 1,
          lines: [{ type: "add", content: "totally new file line", oldLineNumber: null, newLineNumber: 1 }],
        },
      ],
    },
  ],
};

function renderApp() {
  return render(
    <App
      diff={diff}
      diffId="test-diff"
      sourceLabel="fixture"
      record={{ comments: {}, viewedFileIds: [] }}
      moveLookup={new Map()}
      findReplaces={[]}
    />,
  );
}

// Ink's renderer commits a keypress-triggered state update asynchronously
// (its own scheduler, separate from the synchronous 'readable' stdin event),
// so lastFrame() right after stdin.write() can still show the pre-keypress
// frame — a tick is needed before asserting on the result.
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

async function press(stdin: { write: (data: string) => void }, data: string): Promise<void> {
  stdin.write(data);
  await flush();
}

describe("TUI App", () => {
  it("renders the file list with per-file stats", () => {
    const frame = renderApp().lastFrame();
    expect(frame).toContain("src/a.ts");
    expect(frame).toContain("src/b.ts");
    expect(frame).toContain("2 files changed");
  });

  it("collapses the file under the cursor when 'c' is pressed", async () => {
    const { stdin, lastFrame } = renderApp();
    expect(lastFrame()).toContain("old line");

    await press(stdin, "c"); // cursor starts on f1's file-header row
    const frame = lastFrame();
    expect(frame).not.toContain("old line");
    expect(frame).toContain("▸");
  });

  it("opens a comment editor with 'm' and shows the saved note after Enter", async () => {
    const { stdin, lastFrame } = renderApp();
    await press(stdin, "j"); // file-header -> hunk-header
    await press(stdin, "j"); // hunk-header -> the "old line" del row
    await press(stdin, "m");
    expect(lastFrame()).toContain("Comment:");

    await press(stdin, "looks risky");
    await press(stdin, "\r");
    const frame = lastFrame();
    expect(frame).not.toContain("Comment:");
    expect(frame).toContain("looks risky");
  });

  it("toggles into split view with 's' and shows both sides of a modify-pair on one row", async () => {
    const { stdin, lastFrame } = renderApp();
    expect(lastFrame()).toContain("j/k move · c collapse · v viewed · m comment · / search · s split");

    await press(stdin, "s");
    const frame = lastFrame();
    expect(frame).toContain("old line");
    expect(frame).toContain("new line");
    expect(frame).toContain("s unified"); // footer now offers to toggle back

    await press(stdin, "s");
    expect(lastFrame()).toContain("s split"); // back to unified, offering split again
  });

  it("searches with '/' and jumps to the match on Enter, expanding a collapsed target file", async () => {
    const { stdin, lastFrame } = renderApp();
    for (let i = 0; i < 5; i += 1) await press(stdin, "j"); // move cursor down to f2's file-header row
    expect(lastFrame()).toContain("src/b.ts");
    await press(stdin, "c"); // collapse f2, the file the search match below lives in
    expect(lastFrame()).not.toContain("totally new file line");

    await press(stdin, "/");
    expect(lastFrame()).toContain("Search:");

    await press(stdin, "totally new file");
    await press(stdin, "\r");
    const frame = lastFrame();
    expect(frame).not.toContain("Search:");
    expect(frame).toContain("totally new file line");
  });
});
