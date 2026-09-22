import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { DiffRecord } from "../types";

// Node-only counterpart to comments.ts's localStorage-backed store — there's
// no browser origin/localStorage in a terminal, so the TUI persists the same
// DiffRecord shape (keyed by the same hashDiffText id) to a single file
// under the user's home directory instead.
const STORE_DIR = path.join(homedir(), ".diffly");
const STORE_FILE = path.join(STORE_DIR, "state.json");

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

export function loadDiffRecordFs(diffId: string): DiffRecord {
  return readAll()[diffId] ?? emptyRecord();
}

export function writeDiffRecordFs(diffId: string, record: DiffRecord): void {
  const all = readAll();
  all[diffId] = record;
  writeAll(all);
}
