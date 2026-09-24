#!/usr/bin/env node
// Resolves a diff from an argument, a pipe, or the surrounding git repo, and
// renders it in the terminal. See bin/lib.js for the pure input-resolution
// logic and src/tui/ for the renderer this hands off to.

import { fstatSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveDiffInput } from "./lib.js";

// `process.stdin.isTTY` is falsy both for a real pipe (`git diff | diffly`)
// AND for a non-interactive shell that hasn't piped or redirected anything
// into stdin at all — the exact shape of many sandboxed/agent tool-call
// environments. Treating the latter as "stdin is piped" makes
// readFileSync(0) block forever waiting for input/EOF that never arrives.
// A FIFO or a regular file on fd 0 means something was actually piped or
// redirected in; anything else (including a non-TTY with nothing attached)
// falls through to the git-diff fallback instead of hanging.
function hasPipedStdin() {
  try {
    const stat = fstatSync(0);
    return stat.isFIFO() || stat.isFile();
  } catch {
    return false;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function execGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

async function main() {
  // The terminal UI is the only mode now, so `--tui` is redundant — still
  // accepted and ignored so anyone who has it in a script or muscle memory
  // isn't punished for it.
  const args = process.argv.slice(2).filter((arg) => arg !== "--tui");

  const result = resolveDiffInput({
    argPath: args[0],
    isTTY: !hasPipedStdin(),
    readFile: (p) => readFileSync(p, "utf8"),
    readStdin: () => readFileSync(0, "utf8"),
    execGit,
  });

  if (!result.ok) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  // Bundled separately by esbuild (see package.json's build:tui script):
  // Ink and its React renderer belong to the viewer, not to this entry
  // point, so they're only loaded once there's actually a diff to show.
  const distTuiPath = path.join(__dirname, "..", "dist-tui", "index.js");
  let runTui;
  try {
    ({ runTui } = await import(pathToFileURL(distTuiPath).href));
  } catch {
    console.error(`No build found at ${distTuiPath}. Run "npm run build" first.`);
    process.exitCode = 1;
    return;
  }

  await runTui(result.text, result.source);
}

main();
