import { Check } from "lucide-react";
import type { DiffFile } from "../types";

const STATUS_DOT: Record<DiffFile["status"], string> = {
  added: "bg-diff-add-text",
  deleted: "bg-diff-del-text",
  modified: "bg-accent",
  renamed: "bg-text-faint",
};

export default function SidebarFileItem({ file, viewed }: { file: DiffFile; viewed: boolean }) {
  const path = file.newPath ?? file.oldPath ?? "unknown";
  const displayName = path.split("/").pop();
  const dir = path.slice(0, path.length - (displayName?.length ?? 0));

  return (
    <a
      href={`#file-${file.id}`}
      title={path}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent-muted ${viewed ? "opacity-50" : ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[file.status]}`} />
      <span
        className={`flex min-w-0 flex-1 items-center font-mono ${viewed ? "line-through decoration-text-faint" : ""}`}
      >
        <span className="min-w-0 truncate text-text-faint">{dir}</span>
        <span className="shrink-0 text-text">{displayName}</span>
      </span>
      {viewed && <Check className="h-3 w-3 shrink-0 text-diff-add-text" />}
      {!file.isBinary && (
        <span className="shrink-0 font-mono">
          <span className="text-diff-add-text">+{file.additions}</span>{" "}
          <span className="text-diff-del-text">−{file.deletions}</span>
        </span>
      )}
    </a>
  );
}
