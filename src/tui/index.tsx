import { render } from "ink";
import { hashDiffText } from "../lib/comments";
import { detectOperations } from "../lib/detectOperations";
import { loadDiffRecordFs } from "../lib/diffStore";
import { loadDiffText } from "../lib/ingestDiff";
import { buildMoveLookup } from "../lib/moveLookup";
import App from "./App";

/**
 * Entry point bundled by esbuild into dist-tui/index.js (see package.json's
 * build:tui script) and dynamically imported by bin/diffly.js's --tui
 * branch. Kept separate from the browser's main.tsx/App.tsx: this renders
 * to a terminal via Ink, not the DOM, and needs its own bundle since Vite's
 * browser build isn't the right tool for a Node-target executable.
 */
export async function runTui(diffText: string, sourceLabel: string): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("diffly --tui requires an interactive terminal (no TTY detected).");
    process.exitCode = 1;
    return;
  }

  const result = loadDiffText(diffText);
  if (!result.ok) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  const diffId = hashDiffText(diffText);
  const record = loadDiffRecordFs(diffId);
  const operations = detectOperations(result.diff);
  const moveLookup = buildMoveLookup(operations.moves);

  const { waitUntilExit } = render(
    <App
      diff={result.diff}
      diffId={diffId}
      sourceLabel={sourceLabel}
      record={record}
      moveLookup={moveLookup}
      findReplaces={operations.findReplaces}
    />,
  );

  await waitUntilExit();
}
