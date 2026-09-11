import { useState } from "react";
import { useDiff } from "../context/DiffContext";

export default function PasteDiffPanel() {
  const { loadDiff } = useDiff();
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Or paste diff text here…"
        rows={6}
        className="w-full resize-y rounded-lg border border-border bg-surface p-3 font-mono text-xs text-text placeholder:text-text-faint focus-visible:border-accent"
      />
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => loadDiff(text, null)}
        className="self-end rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Load diff
      </button>
    </div>
  );
}
