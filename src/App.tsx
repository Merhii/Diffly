import { useEffect, useMemo, useRef } from "react";
import DiffFile from "./components/DiffFile";
import ErrorBanner from "./components/ErrorBanner";
import FindReplaceSummary from "./components/FindReplaceSummary";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import WelcomeScreen from "./components/WelcomeScreen";
import { useDiff } from "./context/DiffContext";
import { detectOperations } from "./lib/detectOperations";
import { buildMoveLookup } from "./lib/moveLookup";

export default function App() {
  const { state, loadDiff, clearDiff, toggleFileCollapsed, toggleFileViewed, setComment, setSearchQuery } =
    useDiff();
  const { diff, theme, viewMode, sidebarCollapsed, collapsedFileIds, viewedFileIds, comments, search, loadError } =
    state;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const preloaded = window.__DIFFLY_PRELOADED_DIFF__;
    if (preloaded) loadDiff(preloaded, "CLI");
    // Only ever relevant once, on the initial page the CLI served — not a
    // reactive dependency, so intentionally an empty deps array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const operations = useMemo(() => (diff ? detectOperations(diff) : null), [diff]);
  const moveLookup = useMemo(() => buildMoveLookup(operations?.moves ?? []), [operations]);

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

  const fileIndexRef = useRef(0);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      return target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Escape always clears an active search, regardless of what has
      // focus — typing in a comment box shouldn't block "get me out of
      // this search."
      if (event.key === "Escape") {
        if (search.query) {
          setSearchQuery("");
          const active = document.activeElement;
          if (active instanceof HTMLElement && active.id === "diffly-search") active.blur();
        }
        return;
      }

      // j/k/slash are navigation shortcuts, not something that should fire
      // while the user is typing in search or a line comment.
      if (isTypingTarget(event.target)) return;

      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("diffly-search")?.focus();
        return;
      }

      if (!diff || diff.files.length === 0) return;

      if (event.key === "j" || event.key === "k") {
        const delta = event.key === "j" ? 1 : -1;
        const next = Math.min(Math.max(fileIndexRef.current + delta, 0), diff.files.length - 1);
        fileIndexRef.current = next;
        const fileId = diff.files[next].id;
        document
          .querySelector(`[data-file-anchor="${fileId}"]`)
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [diff, search.query, setSearchQuery]);

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
        {!sidebarCollapsed && <Sidebar files={diff.files} viewedFileIds={viewedFileIds} />}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {operations && <FindReplaceSummary findReplaces={operations.findReplaces} />}
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
                moveLookup={moveLookup}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
