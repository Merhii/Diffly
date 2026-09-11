import parseDiffLib from "parse-diff";
import type { DiffFile, DiffHunk, DiffLine, FileChangeStatus, ParsedDiff } from "../types";

// parse-diff doesn't understand "Binary files ... differ" or "rename
// from/to" header lines at all (they're silently dropped) — path info still
// comes through correctly via the `diff --git a/X b/Y` line itself, but
// binary detection has to be done ourselves against the raw text.
const BINARY_MARKER = /^Binary files .* differ$/m;

// parse-diff also injects a bogus extra "change" for `\ No newline at end of
// file` markers, copying the type/line-numbers of the preceding real change
// but with this literal text as its content — filter it out and use it only
// as a flag.
const NO_NEWLINE_MARKER = "\\ No newline at end of file";

function splitFileSections(raw: string): string[] {
  return raw.split(/(?=^diff --git )/m).filter((section) => section.trim().length > 0);
}

// parse-diff keeps the raw unified-diff marker character ('+', '-', or a
// leading space for context) as the first character of `content`.
function stripMarker(content: string): string {
  return content.length > 0 ? content.slice(1) : content;
}

export function parseDiffText(raw: string): ParsedDiff {
  const rawFiles = parseDiffLib(raw);
  const rawSections = splitFileSections(raw);

  const files: DiffFile[] = rawFiles.map((rawFile, index) => {
    const rawSection = rawSections[index] ?? "";
    const isBinary = BINARY_MARKER.test(rawSection);

    let noNewlineAtEndOfFile = false;

    const hunks: DiffHunk[] = rawFile.chunks.map((chunk) => {
      const lines: DiffLine[] = [];

      for (const change of chunk.changes) {
        if (change.content === NO_NEWLINE_MARKER) {
          noNewlineAtEndOfFile = true;
          continue;
        }

        const content = stripMarker(change.content);

        if (change.type === "add") {
          lines.push({ type: "add", content, oldLineNumber: null, newLineNumber: change.ln });
        } else if (change.type === "del") {
          lines.push({ type: "del", content, oldLineNumber: change.ln, newLineNumber: null });
        } else {
          lines.push({
            type: "context",
            content,
            oldLineNumber: change.ln1,
            newLineNumber: change.ln2,
          });
        }
      }

      return {
        header: chunk.content,
        oldStart: chunk.oldStart,
        oldLines: chunk.oldLines,
        newStart: chunk.newStart,
        newLines: chunk.newLines,
        lines,
      };
    });

    const oldPath = rawFile.from && rawFile.from !== "/dev/null" ? rawFile.from : null;
    const newPath = rawFile.to && rawFile.to !== "/dev/null" ? rawFile.to : null;

    let status: FileChangeStatus;
    if (rawFile.new || (oldPath === null && newPath !== null)) {
      status = "added";
    } else if (rawFile.deleted || (newPath === null && oldPath !== null)) {
      status = "deleted";
    } else if (oldPath && newPath && oldPath !== newPath && hunks.length === 0) {
      status = "renamed";
    } else {
      status = "modified";
    }

    return {
      id: `${index}-${newPath ?? oldPath ?? "unknown"}`,
      oldPath,
      newPath,
      status,
      isBinary,
      additions: rawFile.additions,
      deletions: rawFile.deletions,
      hunks,
      noNewlineAtEndOfFile,
    };
  });

  return { files };
}
