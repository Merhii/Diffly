import { Replace } from "lucide-react";
import { scrollToLineKey } from "../lib/scrollToLineKey";
import type { FindReplaceOperation } from "../types";

/** Renders nothing when there are no detected find/replace operations — no empty state, no placeholder. */
export default function FindReplaceSummary({ findReplaces }: { findReplaces: FindReplaceOperation[] }) {
  if (findReplaces.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
      <span className="flex shrink-0 items-center gap-1.5 font-medium text-text-muted">
        <Replace className="h-3.5 w-3.5" />
        Find/Replace detected
      </span>
      {findReplaces.map((fr) => (
        <button
          key={`${fr.oldText}->${fr.newText}`}
          type="button"
          onClick={() => scrollToLineKey(fr.occurrences[0].addKey)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-accent-muted px-2.5 py-1 font-mono text-accent hover:border-accent"
        >
          <span>
            {fr.oldText} → {fr.newText}
          </span>
          <span className="font-sans text-text-faint">· {fr.occurrences.length} occurrences</span>
        </button>
      ))}
    </div>
  );
}
