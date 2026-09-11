import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import type { DiffFile } from "../types";

const STATUS_LABEL: Record<DiffFile["status"], string> = {
  added: "Added",
  deleted: "Deleted",
  modified: "Modified",
  renamed: "Renamed",
};

const STATUS_COLOR: Record<DiffFile["status"], string> = {
  added: "text-diff-add-text",
  deleted: "text-diff-del-text",
  modified: "text-accent",
  renamed: "text-text-muted",
};

export default function FileHeader({
  file,
  collapsed,
  onToggleCollapsed,
}: {
  file: DiffFile;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggleCollapsed}
      data-file-anchor={file.id}
      className="flex w-full items-center gap-2 border-b border-border bg-surface px-3 py-2 text-left"
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-text-faint" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0 text-text-faint" />
      )}

      <span className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-sm text-text">
        {file.status === "renamed" ? (
          <>
            <span className="truncate text-text-muted">{file.oldPath}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-faint" />
            <span className="truncate">{file.newPath}</span>
          </>
        ) : (
          <span className="truncate">{file.newPath ?? file.oldPath}</span>
        )}
      </span>

      <span className={`shrink-0 text-xs font-medium ${STATUS_COLOR[file.status]}`}>
        {STATUS_LABEL[file.status]}
      </span>

      {!file.isBinary && (
        <span className="shrink-0 font-mono text-xs">
          <span className="text-diff-add-text">+{file.additions}</span>{" "}
          <span className="text-diff-del-text">−{file.deletions}</span>
        </span>
      )}
    </button>
  );
}
