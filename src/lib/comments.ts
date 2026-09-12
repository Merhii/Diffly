import type { DiffRecord } from "../types";

const STORAGE_KEY = "diff-viewer:diffs";

function emptyRecord(): DiffRecord {
  return { comments: {}, viewedFileIds: [] };
}

/**
 * Stable, non-cryptographic identity for a diff's raw text (FNV-1a, 32-bit).
 * Used only to namespace localStorage entries so reopening the exact same
 * diff later restores its comments/viewed-status — collisions are a
 * cosmetic risk (wrong diff's notes reappear), not a security concern.
 */
export function hashDiffText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function readAll(): Record<string, DiffRecord> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DiffRecord>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable (private mode, quota) — comments/viewed just won't persist.
  }
}

export function loadDiffRecord(diffId: string): DiffRecord {
  return readAll()[diffId] ?? emptyRecord();
}

export function writeDiffRecord(diffId: string, record: DiffRecord): void {
  const all = readAll();
  all[diffId] = record;
  writeAll(all);
}
