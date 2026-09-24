import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { DiffRecord } from "../types";

// Per-diff review state (comments, which files you've marked viewed) lives in
// a single JSON file under the user's home directory, keyed by a hash of the
// diff text so reopening the same diff later restores where you left off.
const STORE_DIR = path.join(homedir(), ".diffly");
const STORE_FILE = path.join(STORE_DIR, "state.json");

/**
 * Stable, non-cryptographic identity for a diff's raw text (FNV-1a, 32-bit).
 * Used only to namespace stored entries — a collision is a cosmetic risk
 * (the wrong diff's notes reappear), not a security concern.
 */
export function hashDiffText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function emptyRecord(): DiffRecord {
  return { comments: {}, viewedFileIds: [] };
}

function readAll(): Record<string, DiffRecord> {
  try {
    return JSON.parse(readFileSync(STORE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DiffRecord>): void {
  try {
    if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
    writeFileSync(STORE_FILE, JSON.stringify(all, null, 2));
  } catch {
    // Best-effort — a full disk or permissions issue just means state won't persist.
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
