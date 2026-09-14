import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useState } from "react";
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
  commentText?: string | null;
  onSaveComment?: (text: string) => void;
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
  commentText,
  onSaveComment,
}: DiffLineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(commentText ?? "");

  const segments = renderLineSegments(content, lang, spans);
  const rowBg = ROW_BG[type];
  const hasComment = Boolean(commentText);
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

  function openEditor() {
    setDraft(commentText ?? "");
    setIsEditing(true);
  }

  function handleSave() {
    onSaveComment?.(draft);
    setIsEditing(false);
  }

  function handleDelete() {
    onSaveComment?.("");
    setIsEditing(false);
  }

  return (
    <div>
      <div
        data-match-key={matchKey}
        className={`group/line relative grid ${variant === "unified" ? "grid-cols-[3.5rem_3.5rem_1.25rem_1fr]" : "grid-cols-[3.5rem_1.25rem_1fr]"} font-mono text-[13px] leading-5 ${rowBg} ${matchRing}`}
      >
        {gutters}
        <span className={`select-none ${MARKER_COLOR[type]}`}>{MARKER_CHAR[type]}</span>
        <span className="whitespace-pre-wrap break-all pr-4 text-text">
          <Segments segments={segments} type={type} />
        </span>
        {onSaveComment && (
          <button
            type="button"
            onClick={openEditor}
            aria-label={hasComment ? "Edit comment" : "Add comment"}
            className={`absolute top-0 right-1 flex h-5 w-5 items-center justify-center rounded text-accent hover:bg-accent-muted ${
              hasComment ? "opacity-100" : "opacity-0 group-hover/line:opacity-100 focus-visible:opacity-100"
            }`}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isEditing && (
        <div className="border-t border-border bg-surface-raised px-4 py-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Leave a note to yourself about this line…"
            rows={2}
            className="w-full resize-none rounded-md border border-border-strong bg-surface px-2 py-1.5 font-sans text-xs text-text outline-none focus-visible:border-accent"
          />
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-contrast"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-text-muted"
            >
              Cancel
            </button>
            {hasComment && (
              <button
                type="button"
                onClick={handleDelete}
                className="ml-auto flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-diff-del-text hover:bg-diff-del-bg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {!isEditing && hasComment && (
        <button
          type="button"
          onClick={openEditor}
          className="block w-full border-t border-border bg-surface-raised px-4 py-1.5 text-left font-sans text-xs whitespace-pre-wrap text-text-muted hover:text-text"
        >
          {commentText}
        </button>
      )}
    </div>
  );
}
