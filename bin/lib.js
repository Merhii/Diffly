// Pure logic for the diffly CLI, kept dependency-free and side-effect-free
// (all I/O is injected) so it can be unit tested the same way the rest of
// this codebase tests pure logic — see src/lib/*.test.ts for the pattern.

/**
 * Resolves what diff text to load, in priority order: an explicit file
 * path argument, piped stdin, then `git diff` / `git diff --staged` in the
 * current directory. Every I/O operation is injected so this stays pure
 * and testable without touching the real filesystem/git/stdin.
 *
 * @param {object} deps
 * @param {string|undefined} deps.argPath - first CLI argument, if any
 * @param {boolean} deps.isTTY - true when stdin has nothing genuinely piped/redirected
 *   into it (an interactive terminal, or a non-interactive shell with stdin
 *   simply unattached) — false only when fd 0 is an actual FIFO or file, so
 *   this never blocks trying to read stdin that will never arrive/close
 * @param {(path: string) => string} deps.readFile
 * @param {() => string} deps.readStdin
 * @param {(args: string[]) => string} deps.execGit - runs `git <args>`, returns stdout (or "" on failure)
 * @returns {{ ok: true, text: string, source: string } | { ok: false, error: string }}
 */
export function resolveDiffInput({ argPath, isTTY, readFile, readStdin, execGit }) {
  if (argPath) {
    let text;
    try {
      text = readFile(argPath);
    } catch (err) {
      return { ok: false, error: `Could not read "${argPath}": ${err.message}` };
    }
    return { ok: true, text, source: argPath };
  }

  if (!isTTY) {
    return { ok: true, text: readStdin(), source: "stdin" };
  }

  const unstaged = execGit(["diff"]);
  if (unstaged.trim()) {
    return { ok: true, text: unstaged, source: "git diff" };
  }

  const staged = execGit(["diff", "--staged"]);
  if (staged.trim()) {
    return { ok: true, text: staged, source: "git diff --staged" };
  }

  return {
    ok: false,
    error: "No changes found. Pass a file path, pipe a diff in, or run inside a git repo with uncommitted changes.",
  };
}

// Vite's built index.html always has the app's own bundled entry script as
// a "/assets/..." src (vs. e.g. the analytics script, which is also
// type="module" but points at an external URL) — matching on that is more
// specific than matching any `type="module"` tag, and independent of tag
// order in the file.
const APP_ENTRY_SCRIPT = /<script[^>]*\ssrc="\/assets\/[^"]+"[^>]*><\/script>/i;

/**
 * Injects the preloaded diff text into a built index.html, as an inline
 * script that runs before the app's own entry script.
 *
 * JSON.stringify makes the string a valid, safely-quoted JS literal, but it
 * does NOT make it safe to embed inside an HTML <script> block: the HTML
 * tokenizer looks for the raw text "</script" regardless of JS string
 * context, so a diff containing that text would truncate the tag early.
 * Escaping the slash (`<\/script`) is a no-op inside the JS string (`\/` is
 * just `/`) but breaks the literal match the HTML parser is looking for.
 *
 * @param {string} html
 * @param {string} diffText
 * @returns {string}
 */
export function injectDiffIntoHtml(html, diffText) {
  if (!APP_ENTRY_SCRIPT.test(html)) {
    throw new Error("Could not find the app's bundled entry script in index.html to inject before.");
  }

  const safeJson = JSON.stringify(diffText).replace(/<\/script/gi, "<\\/script");
  const injected = `<script>window.__DIFFLY_PRELOADED_DIFF__ = ${safeJson};</script>\n    `;

  return html.replace(APP_ENTRY_SCRIPT, (match) => injected + match);
}
