import { useEffect, useMemo } from "react";
import DiffFile from "./components/DiffFile";
import ErrorBanner from "./components/ErrorBanner";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import WelcomeScreen from "./components/WelcomeScreen";
import { useDiff } from "./context/DiffContext";

export default function App() {
  const { state, clearDiff, toggleFileCollapsed, toggleFileViewed, setComment } = useDiff();
  const { diff, theme, accent, viewMode, collapsedFileIds, viewedFileIds, comments, search, loadError } = state;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (accent === "indigo") {
      document.documentElement.removeAttribute("data-accent");
    } else {
      document.documentElement.setAttribute("data-accent", accent);
    }
  }, [accent]);

  const activeMatch = search.matches[search.activeIndex] ?? null;

  const matchKeysByFile = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const match of search.matches) {
      if (match.kind !== "line") continue;
      const key = `${match.fileId}:${match.hunkIndex}:${match.lineIndexInHunk}`;
      const set = map.get(match.fileId) ?? new Set<string>();
      set.add(key);
      map.set(match.fileId, set);
    }
    return map;
  }, [search.matches]);

  const activeMatchKey =
    activeMatch?.kind === "line"
      ? `${activeMatch.fileId}:${activeMatch.hunkIndex}:${activeMatch.lineIndexInHunk}`
      : null;

  useEffect(() => {
    if (!activeMatch) return;

    if (collapsedFileIds.has(activeMatch.fileId)) {
      toggleFileCollapsed(activeMatch.fileId);
    }

    const raf = requestAnimationFrame(() => {
      const selector =
        activeMatch.kind === "filename"
          ? `[data-file-anchor="${activeMatch.fileId}"]`
          : `[data-match-key="${activeMatchKey}"]`;
      document.querySelector(selector)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatch, activeMatchKey]);

  if (!diff) {
    return (
      <div className="min-h-screen bg-bg">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Toolbar />
      {loadError && (
        <div className="border-b border-border px-4 py-2">
          <ErrorBanner message={loadError} onDismiss={clearDiff} />
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <Sidebar files={diff.files} viewedFileIds={viewedFileIds} />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {diff.files.map((file) => (
              <DiffFile
                key={file.id}
                file={file}
                viewMode={viewMode}
                collapsed={collapsedFileIds.has(file.id)}
                onToggleCollapsed={() => toggleFileCollapsed(file.id)}
                viewed={viewedFileIds.has(file.id)}
                onToggleViewed={() => toggleFileViewed(file.id)}
                comments={comments}
                onSaveComment={setComment}
                matchKeys={matchKeysByFile.get(file.id) ?? new Set()}
                activeMatchKey={activeMatch?.fileId === file.id ? activeMatchKey : null}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
