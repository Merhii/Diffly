import { useDiff } from "../context/DiffContext";
import BrandMark from "./BrandMark";
import DropZone from "./DropZone";
import ErrorBanner from "./ErrorBanner";
import PasteDiffPanel from "./PasteDiffPanel";

export default function WelcomeScreen() {
  const {
    state: { loadError },
    clearDiff,
  } = useDiff();

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <BrandMark className="h-7 w-7 text-text" />
            <h1 className="text-2xl font-semibold tracking-tight text-text">Diffly</h1>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            Read a .diff or .patch file with syntax highlighting, side-by-side comparison, and search
            — entirely in your browser. Nothing you load here is uploaded anywhere.
          </p>
        </div>

        {loadError && (
          <div className="mb-4">
            <ErrorBanner message={loadError} onDismiss={clearDiff} />
          </div>
        )}

        <DropZone />

        <div className="my-6 flex items-center gap-3 text-xs text-text-faint">
          <div className="h-px flex-1 bg-border" />
          or paste diff text
          <div className="h-px flex-1 bg-border" />
        </div>

        <PasteDiffPanel />

        <footer className="mt-12 border-t border-border pt-6 text-sm text-text-muted">
          <p>
            Coding agents show diffs in a tiny, hard-to-read pane. Diffly reads them like a GitHub
            pull request instead — side-by-side, syntax highlighted, searchable.
          </p>
          <p className="mt-3">
            Next up: a local CLI so agents like Claude Code and Codex can open Diffly directly with
            a diff they've already generated.
          </p>
          <a
            href="https://github.com/Merhii/Diffly"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-text hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Source on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
