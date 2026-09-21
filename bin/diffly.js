#!/usr/bin/env node
// Serves the already-built dist/ bundle with a diff pre-loaded, so a
// developer or a coding agent can open Diffly without any manual
// drag-drop/paste. See bin/lib.js for the pure input-resolution and
// HTML-injection logic this wires together.

import { createServer } from "node:http";
import { readFile as readFileAsync } from "node:fs/promises";
import { fstatSync, readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { injectDiffIntoHtml, resolveDiffInput } from "./lib.js";

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
const distDir = path.join(__dirname, "..", "dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function execGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

// A fixed default port — rather than an ephemeral one — means repeated
// launches land on the same http://localhost:<port> origin, so origin-scoped
// browser state (theme, sidebar, per-diff comments/viewed-status) actually
// persists across separate `diffly` runs instead of resetting every time.
// Falls back to an ephemeral port only if something else already holds this
// one (e.g. two diffly instances running at once) — in that case only
// whichever instance is on the usual port gets the "remembered" state.
const PREFERRED_PORT = 51730;

function listen(server, port, onReady) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && port !== 0) {
      listen(server, 0, onReady);
    } else {
      console.error(`Could not start the server: ${err.message}`);
      process.exitCode = 1;
    }
  });
  server.listen(port, onReady);
}

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  // "start" is a cmd.exe builtin, not an executable — needs a shell, and an
  // empty title argument so a URL containing spaces/special chars isn't
  // misread as the window title.
  const child =
    platform === "win32"
      ? spawn("cmd", ["/c", "start", '""', url], { stdio: "ignore", detached: true })
      : spawn(command, [url], { stdio: "ignore", detached: true });
  child.on("error", () => {
    console.error(`Could not open a browser automatically — open ${url} manually.`);
  });
  child.unref();
}

function main() {
  // viewer.html (not index.html) is the review app — index.html is the
  // public marketing site's entry and has no diff-loading capability at
  // all, see vite.config.ts's two-entry build.
  const distViewerPath = path.join(distDir, "viewer.html");
  try {
    readFileSync(distViewerPath);
  } catch {
    console.error(`No build found at ${distDir} (missing viewer.html). Run "npm run build" first.`);
    process.exitCode = 1;
    return;
  }

  const result = resolveDiffInput({
    argPath: process.argv[2],
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

  const server = createServer(async (req, res) => {
    try {
      const requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const isViewer = requestPath === "/" || requestPath === "/viewer.html";
      const filePath = isViewer ? distViewerPath : path.join(distDir, requestPath);

      // never serve a path that escapes dist/
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (isViewer) {
        const html = await readFileAsync(distViewerPath, "utf8");
        const injected = injectDiffIntoHtml(html, result.text);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(injected);
        return;
      }

      const ext = path.extname(filePath);
      const body = await readFileAsync(filePath);
      res.writeHead(200, { "content-type": MIME_TYPES[ext] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  listen(server, PREFERRED_PORT, () => {
    const { port } = server.address();
    const url = `http://localhost:${port}`;
    console.log(`Diffly loaded from ${result.source} — running at ${url} (press Ctrl+C to stop)`);
    openBrowser(url);
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}

main();
