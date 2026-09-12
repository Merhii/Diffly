import type { DiffFile } from "../types";
import SidebarFileItem from "./SidebarFileItem";

export default function Sidebar({ files, viewedFileIds }: { files: DiffFile[]; viewedFileIds: Set<string> }) {
  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);
  const viewedCount = files.filter((file) => viewedFileIds.has(file.id)).length;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-3 py-3">
        <h2 className="text-sm font-semibold text-text">
          {files.length} file{files.length === 1 ? "" : "s"} changed
        </h2>
        <p className="mt-0.5 font-mono text-xs">
          <span className="text-diff-add-text">+{totalAdditions}</span>{" "}
          <span className="text-diff-del-text">−{totalDeletions}</span>
          {viewedCount > 0 && (
            <span className="ml-2 text-text-faint">
              · {viewedCount}/{files.length} viewed
            </span>
          )}
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {files.map((file) => (
          <SidebarFileItem key={file.id} file={file} viewed={viewedFileIds.has(file.id)} />
        ))}
      </nav>
    </aside>
  );
}
