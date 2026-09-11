import { renderLineSegments } from "../lib/renderLine";
import type { LineType, WordDiffSpan } from "../types";

type MatchState = "none" | "match" | "active";

interface DiffLineProps {
  variant: "unified" | "old" | "new";
  oldLineNumber: number | null;
  newLineNumber: number | null;
  type: LineType;
  content: string;
  lang: string;
  spans: WordDiffSpan[] | null;
  matchState: MatchState;
  matchKey?: string;
}

const ROW_BG: Record<LineType, string> = {
  add: "bg-diff-add-bg",
  del: "bg-diff-del-bg",
  context: "",
};

const MARKER_COLOR: Record<LineType, string> = {
  add: "text-diff-add-text",
  del: "text-diff-del-text",
  context: "text-transparent",
};

const MARKER_CHAR: Record<LineType, string> = {
  add: "+",
  del: "−",
  context: "",
};

function Segments({ segments, type }: { segments: ReturnType<typeof renderLineSegments>; type: LineType }) {
  return (
    <>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={
            segment.changed
              ? type === "del"
                ? "bg-diff-word-del-bg rounded-[2px]"
                : "bg-diff-word-add-bg rounded-[2px]"
              : undefined
          }
          dangerouslySetInnerHTML={{ __html: segment.html }}
        />
      ))}
    </>
  );
}

export default function DiffLine({
  variant,
  oldLineNumber,
  newLineNumber,
  type,
  content,
  lang,
  spans,
  matchState,
  matchKey,
}: DiffLineProps) {
  const segments = renderLineSegments(content, lang, spans);
  const rowBg = ROW_BG[type];
  const matchRing =
    matchState === "active"
      ? "outline outline-2 outline-accent -outline-offset-2"
      : matchState === "match"
        ? "bg-accent-muted"
        : "";

  const gutters =
    variant === "unified" ? (
      <>
        <span className="select-none pr-3 text-right text-gutter-text">{oldLineNumber ?? ""}</span>
        <span className="select-none pr-3 text-right text-gutter-text">{newLineNumber ?? ""}</span>
      </>
    ) : (
      <span className="select-none pr-3 text-right text-gutter-text">
        {(variant === "old" ? oldLineNumber : newLineNumber) ?? ""}
      </span>
    );

  return (
    <div
      data-match-key={matchKey}
      className={`grid ${variant === "unified" ? "grid-cols-[3.5rem_3.5rem_1.25rem_1fr]" : "grid-cols-[3.5rem_1.25rem_1fr]"} font-mono text-[13px] leading-5 ${rowBg} ${matchRing}`}
    >
      {gutters}
      <span className={`select-none ${MARKER_COLOR[type]}`}>{MARKER_CHAR[type]}</span>
      <span className="whitespace-pre-wrap break-all pr-4 text-text">
        <Segments segments={segments} type={type} />
      </span>
    </div>
  );
}
