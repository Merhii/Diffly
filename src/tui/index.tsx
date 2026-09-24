import { render } from "ink";
import { detectOperations } from "../lib/detectOperations";
import { hashDiffText, loadDiffRecord } from "../lib/diffStore";
import { loadDiffText } from "../lib/ingestDiff";
import { buildMoveLookup } from "../lib/moveLookup";
import App from "./App";

/**
 * Entry point bundled by esbuild into dist-tui/index.js (see package.json's
 * build:tui script) and dynamically imported by bin/diffly.js once it has a
 * diff to show. Bundled rather than run from source because Ink and React
 * are a real dependency graph, and resolving them at startup from wherever
 * the user happens to have diffly installed is slower and more fragile than
 * shipping one file.
 */
export async function runTui(diffText: string, sourceLabel: string): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("diffly needs an interactive terminal to render in (no TTY detected).");
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
  const record = loadDiffRecord(diffId);
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
