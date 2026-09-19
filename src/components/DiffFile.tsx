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
  const isPureRename = file.status === "renamed" && file.hunks.length === 0;
  // The header needs the section's own rounded corners on its own when it's
  // effectively the whole visible card — otherwise corner-rounding lives on
  // the content wrapper below. Kept as two separately-clipped elements
  // (rather than overflow-hidden on this outer section) specifically so the
  // header can be `position: sticky` relative to the page's scroll
  // container — overflow-hidden on an ancestor constrains sticky to that
  // ancestor's own bounds, which defeats the point here.
  const roundedBottom = collapsed || isPureRename;

  return (
    <section id={`file-${file.id}`} className="rounded-lg border border-border bg-surface">
      <FileHeader
        file={file}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        viewed={viewed}
        onToggleViewed={onToggleViewed}
        roundedBottom={roundedBottom}
      />
      {!collapsed && !isPureRename && (
        <div className="overflow-hidden rounded-b-lg">
          {file.isBinary ? (
            <BinaryFilePlaceholder />
          ) : viewMode === "unified" ? (
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
        </div>
      )}
    </section>
  );
}
