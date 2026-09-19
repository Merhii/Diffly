import { getLanguageForPath } from "../lib/languageMap";
import type { MoveCounterpart } from "../lib/moveLookup";
import type { DiffFile as DiffFileType, ViewMode } from "../types";
import BinaryFilePlaceholder from "./BinaryFilePlaceholder";
import FileHeader from "./FileHeader";
import SideBySideDiffView from "./SideBySideDiffView";
import UnifiedDiffView from "./UnifiedDiffView";

export default function DiffFile({
  file,
  viewMode,
  collapsed,
  onToggleCollapsed,
  viewed,
  onToggleViewed,
  comments,
  onSaveComment,
  matchKeys,
  activeMatchKey,
  moveLookup,
}: {
  file: DiffFileType;
  viewMode: ViewMode;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  viewed: boolean;
  onToggleViewed: () => void;
  comments: Record<string, string>;
  onSaveComment: (lineKey: string, text: string) => void;
  matchKeys: Set<string>;
  activeMatchKey: string | null;
  moveLookup: Map<string, MoveCounterpart>;
}) {
  const lang = getLanguageForPath(file.newPath ?? file.oldPath);

  return (
    <section id={`file-${file.id}`} className="overflow-hidden rounded-lg border border-border bg-surface">
      <FileHeader
        file={file}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        viewed={viewed}
        onToggleViewed={onToggleViewed}
      />
      {!collapsed && (
        <>
          {file.isBinary ? (
            <BinaryFilePlaceholder />
          ) : file.status === "renamed" && file.hunks.length === 0 ? null : viewMode === "unified" ? (
            <UnifiedDiffView
              file={file}
              lang={lang}
              matchKeys={matchKeys}
              activeMatchKey={activeMatchKey}
              comments={comments}
              onSaveComment={onSaveComment}
              moveLookup={moveLookup}
            />
          ) : (
            <SideBySideDiffView
              file={file}
              lang={lang}
              matchKeys={matchKeys}
              activeMatchKey={activeMatchKey}
              comments={comments}
              onSaveComment={onSaveComment}
              moveLookup={moveLookup}
            />
          )}
        </>
      )}
    </section>
  );
}
