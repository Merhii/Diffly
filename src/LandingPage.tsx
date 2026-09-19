import { ArrowRight, Check, Copy, Heart, Terminal } from "lucide-react";
import { useState } from "react";
import BrandMark from "./components/BrandMark";
import Modal from "./components/Modal";

const GITHUB_ICON_PATH =
  "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z";

const LINKEDIN_ICON_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

const COMMANDS = [
  { command: "diffly", note: "reviews the current git diff (falls back to git diff --staged)" },
  { command: "git diff | diffly", note: "pipe any diff in" },
  { command: "diffly my.patch", note: "or point it at a file" },
];

function CommandLine({ command, note }: { command: string; note: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2">
      <div className="min-w-0">
        <code className="font-mono text-sm text-text">{command}</code>
        <p className="mt-0.5 truncate text-xs text-text-faint">{note}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy "${command}"`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-faint hover:bg-accent-muted hover:text-accent"
      >
        {copied ? <Check className="h-4 w-4 text-diff-add-text" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function LandingPage() {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <BrandMark className="h-7 w-7 text-text" />
            <h1 className="text-2xl font-bold tracking-tight text-text">Diffly</h1>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            A GitHub-PR-style diff viewer that opens from your terminal — for you, or for a coding
            agent handing off a diff it just generated.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-3 text-xs font-medium text-text-muted">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-4 w-4" />
            Terminal
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-text-faint" />
          <span>Generate or receive a diff</span>
          <ArrowRight className="h-3.5 w-3.5 text-text-faint" />
          <span className="flex items-center gap-1.5">
            <BrandMark className="h-4 w-4" />
            Review opens here
          </span>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-surface-raised p-3">
          {COMMANDS.map((c) => (
            <CommandLine key={c.command} command={c.command} note={c.note} />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-text-faint">
          Runs a local server on your machine and opens this page with the diff already loaded.
          Nothing leaves your computer. Not on npm yet —{" "}
          <a
            href="https://github.com/Merhii/Diffly#cli"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-accent"
          >
            clone the repo and run npm link
          </a>
          .
        </p>

        <footer className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setWhyOpen(true)}
              className="text-text underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              Why Diffly?
            </button>
            <span className="text-text-faint">·</span>
            <a
              href="https://github.com/Merhii/Diffly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-text hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d={GITHUB_ICON_PATH} />
              </svg>
              Source on GitHub
            </a>
            <span className="text-text-faint">·</span>
            <a
              href="https://github.com/sponsors/Merhii"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-text hover:text-accent"
            >
              <Heart className="h-4 w-4" />
              Sponsor
            </a>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-text-faint">
            <span>Made by Karim Merhi</span>
            <a
              href="https://github.com/Merhii"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Karim Merhi on GitHub"
              className="text-text-faint hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d={GITHUB_ICON_PATH} />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/karimmerhi/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Karim Merhi on LinkedIn"
              className="text-text-faint hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d={LINKEDIN_ICON_PATH} />
              </svg>
            </a>
          </div>
        </footer>

        <Modal open={whyOpen} onClose={() => setWhyOpen(false)} title="Why Diffly?">
          <p>
            Coding agents show diffs in a tiny, hard-to-read pane. Diffly reads them like a GitHub
            pull request instead — side-by-side, syntax highlighted, searchable.
          </p>
          <p>
            It opens straight from your terminal (or an agent's), with no accounts, no upload, and
            nothing ever leaving your machine.
          </p>
        </Modal>
      </div>
    </div>
  );
}
