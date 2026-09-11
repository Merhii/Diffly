import type { DiffFile } from "../types";

const STATUS_DOT: Record<DiffFile["status"], string> = {
  added: "bg-diff-add-text",
  deleted: "bg-diff-del-text",
  modified: "bg-accent",
  renamed: "bg-text-faint",
};

export default function SidebarFileItem({ file }: { file: DiffFile }) {
  const path = file.newPath ?? file.oldPath ?? "unknown";
  const displayName = path.split("/").pop();
  const dir = path.slice(0, path.length - (displayName?.length ?? 0));

  return (
    <a
      href={`#file-${file.id}`}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent-muted"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[file.status]}`} />
      <span className="min-w-0 flex-1 truncate font-mono">
        <span className="text-text-faint">{dir}</span>
        <span className="text-text">{displayName}</span>
      </span>
      {!file.isBinary && (
        <span className="shrink-0 font-mono">
          <span className="text-diff-add-text">+{file.additions}</span>{" "}
          <span className="text-diff-del-text">−{file.deletions}</span>
        </span>
      )}
    </a>
  );
}
