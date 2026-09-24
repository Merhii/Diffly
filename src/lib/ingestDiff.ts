import { parseDiffText } from "./parseDiff";
import type { ParsedDiff } from "../types";

export type IngestResult = { ok: true; diff: ParsedDiff } | { ok: false; error: string };

/**
 * Single entry point for turning raw diff text into a ParsedDiff, wherever
 * that text came from — a file argument, a pipe, or `git diff`. Pure and
 * renderer-agnostic, so parse failures surface as a value to show rather
 * than an exception to catch at the call site.
 */
export function loadDiffText(rawText: string): IngestResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, error: "That file is empty." };
  }

  try {
    const diff = parseDiffText(rawText);
    if (diff.files.length === 0) {
      return { ok: false, error: "No changed files found — is this a valid .diff/.patch file?" };
    }
    return { ok: true, diff };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse diff.";
    return { ok: false, error: message };
  }
}
