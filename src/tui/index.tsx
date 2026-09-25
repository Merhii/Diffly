import { openSync } from "node:fs";
import { ReadStream } from "node:tty";
import { render } from "ink";
import { detectOperations } from "../lib/detectOperations";
import { hashDiffText, loadDiffRecord } from "../lib/diffStore";
import { loadDiffText } from "../lib/ingestDiff";
import { buildMoveLookup } from "../lib/moveLookup";
import App from "./App";

/**
 * The stream to read keystrokes from.
 *
 * With `git diff | diffly`, the diff arrives on stdin — which leaves stdin a
 * spent pipe, not a keyboard. Pagers hit this constantly (less, fzf, delta)
 * and all solve it the same way: reopen the controlling terminal directly
 * and read input from there instead. Returns null when there's no terminal
 * to reopen, e.g. cron, CI, or an agent's tool-call sandbox.
 */
function openKeyboardStream(): NodeJS.ReadStream | null {
  if (process.stdin.isTTY) return process.stdin;

  try {
    // No /dev/tty on Windows; that platform falls through to the error path.
    const stream = new ReadStream(openSync("/dev/tty", "r"));
    return stream.isTTY ? stream : null;
  } catch {
    return null;
  }
}

/**
 * Entry point bundled by esbuild into dist-tui/index.js (see package.json's
 * build:tui script) and dynamically imported by bin/diffly.js once it has a
 * diff to show. Bundled rather than run from source because Ink and React
 * are a real dependency graph, and resolving them at startup from wherever
 * the user happens to have diffly installed is slower and more fragile than
 * shipping one file.
 */
export async function runTui(diffText: string, sourceLabel: string): Promise<void> {
  if (!process.stdout.isTTY) {
    console.error("diffly needs a terminal to render into (stdout is not a TTY).");
    process.exitCode = 1;
    return;
  }

  const stdin = openKeyboardStream();
  if (!stdin) {
    console.error("diffly needs an interactive terminal to read keys from (no TTY available).");
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
    { stdin, stdout: process.stdout },
  );

  await waitUntilExit();

  // A reopened /dev/tty handle keeps the event loop alive, so the process
  // would hang after quitting without this. process.stdin is left alone —
  // Ink manages that one itself.
  if (stdin !== process.stdin) stdin.destroy();
}
