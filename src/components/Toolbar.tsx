import { ChevronsDownUp, ChevronsUpDown, Columns2, Rows3, Upload } from "lucide-react";
import { useDiff } from "../context/DiffContext";
import AccentPicker from "./AccentPicker";
import BrandMark from "./BrandMark";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

export default function Toolbar() {
  const {
    state: { viewMode, sourceLabel },
    setViewMode,
    expandAll,
    collapseAll,
    clearDiff,
  } = useDiff();

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
      <span className="flex shrink-0 items-center gap-1.5 pr-1 font-semibold tracking-tight text-text">
        <BrandMark className="h-4 w-4" />
        Diffly
      </span>

      <button
        type="button"
        onClick={clearDiff}
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-accent hover:text-accent"
      >
        <Upload className="h-3.5 w-3.5" />
        Load another diff
      </button>

      {sourceLabel && (
        <span className="hidden truncate font-mono text-xs text-text-faint sm:inline">{sourceLabel}</span>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <SearchBar />

        <div className="flex shrink-0 overflow-hidden rounded-md border border-border">
          <button
            type="button"
            onClick={() => setViewMode("unified")}
            aria-pressed={viewMode === "unified"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium ${
              viewMode === "unified" ? "bg-accent text-accent-contrast" : "text-text-muted hover:text-text"
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" />
            Unified
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            aria-pressed={viewMode === "split"}
            className={`flex items-center gap-1.5 border-l border-border px-2.5 py-1.5 text-xs font-medium ${
              viewMode === "split" ? "bg-accent text-accent-contrast" : "text-text-muted hover:text-text"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Split
          </button>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={expandAll}
            aria-label="Expand all files"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:border-accent hover:text-accent"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            aria-label="Collapse all files"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:border-accent hover:text-accent"
          >
            <ChevronsDownUp className="h-4 w-4" />
          </button>
        </div>

        <AccentPicker />
        <ThemeToggle />
      </div>
    </header>
  );
}
