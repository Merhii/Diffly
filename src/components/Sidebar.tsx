import type { DiffFile } from "../types";
import SidebarFileItem from "./SidebarFileItem";

export default function Sidebar({ files }: { files: DiffFile[] }) {
  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-3 py-3">
        <h2 className="text-sm font-semibold text-text">
          {files.length} file{files.length === 1 ? "" : "s"} changed
        </h2>
        <p className="mt-0.5 font-mono text-xs">
          <span className="text-diff-add-text">+{totalAdditions}</span>{" "}
          <span className="text-diff-del-text">−{totalDeletions}</span>
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {files.map((file) => (
          <SidebarFileItem key={file.id} file={file} />
        ))}
      </nav>
    </aside>
  );
}
