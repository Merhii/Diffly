import { writeDiffRecordFs } from "../lib/diffStore";
import type { FindReplaceOperation, ParsedDiff, SearchMatch } from "../types";
import type { MoveCounterpart } from "../lib/moveLookup";
import { buildTuiRows, type TuiRow } from "./buildRows";

export type Mode = "browse" | "search" | "comment" | "help";

export interface TuiState {
  diff: ParsedDiff;
  diffId: string;
  moveLookup: Map<string, MoveCounterpart>;
  findReplaces: FindReplaceOperation[];
  collapsedFileIds: Set<string>;
  viewedFileIds: Set<string>;
  comments: Record<string, string>;
  cursorRow: number;
  mode: Mode;
  inputBuffer: string;
  commentTargetKey: string | null;
  searchMatches: SearchMatch[];
  searchActiveIndex: number;
  statusMessage: string | null;
  /** A lineKey (or "file:<id>" for a filename match) the UI should jump to
   * once its file is confirmed expanded — see App.tsx's jump effect. */
  pendingJumpKey: string | null;
}

export type Action =
  | { type: "SET_CURSOR"; row: number }
  | { type: "MOVE_CURSOR"; delta: number; rowCount: number }
  | { type: "TOGGLE_COLLAPSE"; fileId: string }
  | { type: "TOGGLE_VIEWED"; fileId: string }
  | { type: "ENTER_SEARCH" }
  | { type: "ENTER_COMMENT"; lineKey: string; initialText: string }
  | { type: "INPUT_CHAR"; char: string }
  | { type: "INPUT_BACKSPACE" }
  | { type: "SUBMIT_SEARCH"; matches: SearchMatch[]; pendingJumpKey: string | null }
  | { type: "SUBMIT_COMMENT" }
  | { type: "DELETE_COMMENT" }
  | { type: "EXIT_MODE" }
  | { type: "JUMP_TO_MATCH"; direction: 1 | -1 }
  | { type: "CLEAR_PENDING_JUMP" }
  | { type: "REQUEST_EXPAND_FOR_JUMP"; fileId: string }
  | { type: "TOGGLE_HELP" }
  | { type: "SET_STATUS"; message: string | null };

function persist(state: TuiState, comments: Record<string, string>): void {
  writeDiffRecordFs(state.diffId, { comments, viewedFileIds: Array.from(state.viewedFileIds) });
}

export function matchToKey(match: SearchMatch): string {
  return match.kind === "filename" ? `file:${match.fileId}` : `${match.fileId}:${match.hunkIndex}:${match.lineIndexInHunk}`;
}

/** Resolves a jump target (a lineKey, or "file:<id>" for a filename match) to a row index in an already-computed row list. */
export function resolveJumpRow(rows: TuiRow[], jumpKey: string): number {
  if (jumpKey.startsWith("file:")) {
    const fileId = jumpKey.slice("file:".length);
    return rows.findIndex((row) => row.kind === "file-header" && row.fileId === fileId);
  }
  return rows.findIndex((row) => row.kind === "line" && row.matchKey === jumpKey);
}

/** The fileId a jump target belongs to — used to check/clear collapse before resolving its row. */
export function jumpKeyFileId(jumpKey: string): string {
  return jumpKey.startsWith("file:") ? jumpKey.slice("file:".length) : jumpKey.split(":").slice(0, -2).join(":");
}

export function reducer(state: TuiState, action: Action): TuiState {
  switch (action.type) {
    case "SET_CURSOR":
      return { ...state, cursorRow: action.row };
    case "MOVE_CURSOR": {
      const next = Math.min(Math.max(state.cursorRow + action.delta, 0), Math.max(action.rowCount - 1, 0));
      return { ...state, cursorRow: next };
    }
    case "TOGGLE_COLLAPSE": {
      const next = new Set(state.collapsedFileIds);
      if (next.has(action.fileId)) next.delete(action.fileId);
      else next.add(action.fileId);
      return { ...state, collapsedFileIds: next };
    }
    case "TOGGLE_VIEWED": {
      const viewedFileIds = new Set(state.viewedFileIds);
      if (viewedFileIds.has(action.fileId)) viewedFileIds.delete(action.fileId);
      else viewedFileIds.add(action.fileId);
      persist(state, state.comments);
      return { ...state, viewedFileIds };
    }
    case "ENTER_SEARCH":
      return { ...state, mode: "search", inputBuffer: "", statusMessage: null };
    case "ENTER_COMMENT":
      return {
        ...state,
        mode: "comment",
        commentTargetKey: action.lineKey,
        inputBuffer: action.initialText,
      };
    case "INPUT_CHAR":
      return { ...state, inputBuffer: state.inputBuffer + action.char };
    case "INPUT_BACKSPACE":
      return { ...state, inputBuffer: state.inputBuffer.slice(0, -1) };
    case "SUBMIT_SEARCH":
      return {
        ...state,
        mode: "browse",
        searchMatches: action.matches,
        searchActiveIndex: 0,
        pendingJumpKey: action.pendingJumpKey,
        statusMessage: action.matches.length === 0 ? "No matches" : null,
      };
    case "SUBMIT_COMMENT": {
      if (!state.commentTargetKey) return { ...state, mode: "browse" };
      const comments = { ...state.comments };
      if (state.inputBuffer.trim() === "") delete comments[state.commentTargetKey];
      else comments[state.commentTargetKey] = state.inputBuffer;
      persist(state, comments);
      return { ...state, mode: "browse", comments, commentTargetKey: null, inputBuffer: "" };
    }
    case "DELETE_COMMENT": {
      if (!state.commentTargetKey) return { ...state, mode: "browse" };
      const comments = { ...state.comments };
      delete comments[state.commentTargetKey];
      persist(state, comments);
      return { ...state, mode: "browse", comments, commentTargetKey: null, inputBuffer: "" };
    }
    case "EXIT_MODE":
      return { ...state, mode: "browse", inputBuffer: "", commentTargetKey: null };
    case "JUMP_TO_MATCH": {
      if (state.searchMatches.length === 0) return state;
      const len = state.searchMatches.length;
      const nextIndex = (state.searchActiveIndex + action.direction + len) % len;
      return {
        ...state,
        searchActiveIndex: nextIndex,
        pendingJumpKey: matchToKey(state.searchMatches[nextIndex]),
      };
    }
    case "CLEAR_PENDING_JUMP":
      return { ...state, pendingJumpKey: null };
    case "REQUEST_EXPAND_FOR_JUMP": {
      const next = new Set(state.collapsedFileIds);
      next.delete(action.fileId);
      return { ...state, collapsedFileIds: next };
    }
    case "TOGGLE_HELP":
      return { ...state, mode: state.mode === "help" ? "browse" : "help" };
    case "SET_STATUS":
      return { ...state, statusMessage: action.message };
    default:
      return state;
  }
}

export function currentRows(state: TuiState): TuiRow[] {
  return buildTuiRows(state.diff, state.collapsedFileIds, state.viewedFileIds, state.moveLookup);
}
