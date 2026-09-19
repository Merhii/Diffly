import { lineKey } from "../lib/lineKey";
import type { MoveCounterpart } from "../lib/moveLookup";
import { pairHunkLines } from "../lib/pairLines";
import { computeWordDiff } from "../lib/wordDiff";
import type { DiffFile } from "../types";
import DiffLine from "./DiffLine";
import HunkHeader from "./HunkHeader";

export default function UnifiedDiffView({
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
            <HunkHeader header={hunk.header} />
            {rows.map((row, rowIndex) => {
              if (row.kind === "context" && row.left) {
                const key = lineKey(file.id, hunkIndex, row.left, hunk.lines);
                return (
                  <DiffLine
                    key={rowIndex}
                    variant="unified"
                    type="context"
                    oldLineNumber={row.left.oldLineNumber}
                    newLineNumber={row.left.newLineNumber}
                    content={row.left.content}
                    lang={lang}
                    spans={null}
                    matchKey={key}
                    matchState={matchState(key)}
                    commentText={comments[key] ?? null}
                    onSaveComment={(text) => onSaveComment(key, text)}
                  />
                );
              }

              const wordDiff =
                row.kind === "modify-pair" && row.left && row.right
                  ? computeWordDiff(row.left.content, row.right.content)
                  : null;
              const leftKey = row.left ? lineKey(file.id, hunkIndex, row.left, hunk.lines) : null;
              const rightKey = row.right ? lineKey(file.id, hunkIndex, row.right, hunk.lines) : null;

              return (
                <div key={rowIndex}>
                  {row.left && leftKey && (
                    <DiffLine
                      variant="unified"
                      type="del"
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
                  )}
                  {row.right && rightKey && (
                    <DiffLine
                      variant="unified"
                      type="add"
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
