import type { DiffLine, SideBySideRow } from "../types";

/**
 * Greedy contiguous-run pairing: within a hunk, pairs each contiguous run of
 * deletions with the contiguous run of additions that immediately follows it.
 * A clean 1:1 pair is eligible for word-diffing ("modify-pair"); longer N:M
 * runs render as flat add/del ("replace") rather than re-diffing sub-blocks.
 */
export function pairHunkLines(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === "context") {
      rows.push({ left: line, right: line, kind: "context" });
      i += 1;
      continue;
    }

    const dels: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "del") {
      dels.push(lines[i]);
      i += 1;
    }

    const adds: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "add") {
      adds.push(lines[i]);
      i += 1;
    }

    const max = Math.max(dels.length, adds.length);
    for (let k = 0; k < max; k += 1) {
      const left = dels[k] ?? null;
      const right = adds[k] ?? null;
      let kind: SideBySideRow["kind"];
      if (left && right) {
        kind = dels.length === 1 && adds.length === 1 ? "modify-pair" : "replace";
      } else if (left) {
        kind = "del";
      } else {
        kind = "add";
      }
      rows.push({ left, right, kind });
    }
  }

  return rows;
}
