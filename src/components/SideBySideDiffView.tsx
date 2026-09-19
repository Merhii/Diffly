import { lineKey } from "../lib/lineKey";
import type { MoveCounterpart } from "../lib/moveLookup";
import { pairHunkLines } from "../lib/pairLines";
import { computeWordDiff } from "../lib/wordDiff";
import type { DiffFile } from "../types";
import DiffLine from "./DiffLine";
import HunkHeader from "./HunkHeader";

function BlankCell() {
  return <div className="grid grid-cols-[3.5rem_1.25rem_1fr] bg-hunk-bg/40" />;
}

export default function SideBySideDiffView({
  file,
  lang,
  matchKeys,
  activeMatchKey,
  comments,
  onSaveComment,
  moveLookup,
}: {
  file: DiffFile;
  lang: string;
  matchKeys: Set<string>;
  activeMatchKey: string | null;
  comments: Record<string, string>;
  onSaveComment: (lineKey: string, text: string) => void;
  moveLookup: Map<string, MoveCounterpart>;
}) {
  const matchState = (key: string) => (key === activeMatchKey ? "active" : matchKeys.has(key) ? "match" : "none");

  return (
    <div className="divide-y divide-border/60">
      {file.hunks.map((hunk, hunkIndex) => {
        const rows = pairHunkLines(hunk.lines);
        return (
          <div key={hunkIndex}>
            <div className="grid grid-cols-2">
              <HunkHeader header={hunk.header} />
              <HunkHeader header="" />
            </div>
            {rows.map((row, rowIndex) => {
              const wordDiff =
                row.kind === "modify-pair" && row.left && row.right
                  ? computeWordDiff(row.left.content, row.right.content)
                  : null;
              const leftKey = row.left ? lineKey(file.id, hunkIndex, row.left, hunk.lines) : null;
              const rightKey = row.right ? lineKey(file.id, hunkIndex, row.right, hunk.lines) : null;
              const leftType = row.kind === "context" ? "context" : "del";
              const rightType = row.kind === "context" ? "context" : "add";

              return (
                <div key={rowIndex} className="grid grid-cols-2">
                  {row.left && leftKey ? (
                    <DiffLine
                      variant="old"
                      type={leftType}
                      oldLineNumber={row.left.oldLineNumber}
                      newLineNumber={null}
                      content={row.left.content}
                      lang={lang}
                      spans={wordDiff?.oldSpans ?? null}
                      matchKey={leftKey}
                      matchState={matchState(leftKey)}
                      commentText={comments[leftKey] ?? null}
                      onSaveComment={(text) => onSaveComment(leftKey, text)}
                      moveInfo={moveLookup.get(leftKey) ?? null}
                    />
                  ) : (
                    <BlankCell />
                  )}
                  {row.right && rightKey ? (
                    <DiffLine
                      variant="new"
                      type={rightType}
                      oldLineNumber={null}
                      newLineNumber={row.right.newLineNumber}
                      content={row.right.content}
                      lang={lang}
                      spans={wordDiff?.newSpans ?? null}
                      matchKey={rightKey}
                      matchState={matchState(rightKey)}
                      commentText={comments[rightKey] ?? null}
                      onSaveComment={(text) => onSaveComment(rightKey, text)}
                      moveInfo={moveLookup.get(rightKey) ?? null}
                    />
                  ) : (
                    <BlankCell />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
