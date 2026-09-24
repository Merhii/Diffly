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
    if (!text.trim()) {
      return { ok: false, error: `"${argPath}" is empty — nothing to review.` };
    }
    return { ok: true, text, source: argPath };
  }

  if (!isTTY) {
    const text = readStdin();
    if (!text.trim()) {
      return { ok: false, error: "No diff received on stdin — nothing to review." };
    }
    return { ok: true, text, source: "stdin" };
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

