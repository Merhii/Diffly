import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useDiff } from "../context/DiffContext";

export default function SearchBar() {
  const {
    state: { search },
    setSearchQuery,
    setSearchScope,
    nextMatch,
    prevMatch,
  } = useDiff();

  const hasMatches = search.matches.length > 0;

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1">
      <Search className="h-3.5 w-3.5 shrink-0 text-text-faint" />
      <input
        id="diffly-search"
        type="text"
        value={search.query}
        onChange={(event) => setSearchQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (event.shiftKey) prevMatch();
            else nextMatch();
          }
        }}
        placeholder="Search diff…"
        className="w-40 bg-transparent text-sm text-text placeholder:text-text-faint focus:outline-none sm:w-56"
      />
      {search.query && (
        <>
          <span className="shrink-0 text-xs tabular-nums text-text-faint">
            {hasMatches ? `${search.activeIndex + 1}/${search.matches.length}` : "0/0"}
          </span>
          <button
            type="button"
            onClick={prevMatch}
            disabled={!hasMatches}
            aria-label="Previous match"
            className="shrink-0 rounded p-0.5 text-text-muted hover:text-accent disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={nextMatch}
            disabled={!hasMatches}
            aria-label="Next match"
            className="shrink-0 rounded p-0.5 text-text-muted hover:text-accent disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="shrink-0 rounded p-0.5 text-text-muted hover:text-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      <label className="ml-1 hidden shrink-0 items-center gap-1 border-l border-border pl-2 text-xs text-text-muted md:flex">
        <input
          type="checkbox"
          checked={search.includeFilenames}
          onChange={(event) => setSearchScope(event.target.checked)}
          className="accent-[var(--color-accent)]"
        />
        filenames
      </label>
    </div>
  );
}
