import { useEffect, useMemo, useReducer } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import type { MoveCounterpart } from "../lib/moveLookup";
import { buildSearchMatches } from "../lib/search";
import type { DiffRecord, FindReplaceOperation, ParsedDiff } from "../types";
import type { TuiRow, TuiSplitSide } from "./buildRows";
import { currentRows, jumpKeyFileId, matchToKey, reducer, resolveJumpRow, type TuiState } from "./store";

// Below this width a split view's two columns would be too cramped to read —
// the toggle just refuses and explains why instead of rendering garbage.
const MIN_SPLIT_COLUMNS = 60;

interface AppProps {
  diff: ParsedDiff;
  diffId: string;
  sourceLabel: string;
  record: DiffRecord;
  moveLookup: Map<string, MoveCounterpart>;
  findReplaces: FindReplaceOperation[];
}

function initialState(props: AppProps): TuiState {
  return {
    diff: props.diff,
    diffId: props.diffId,
    moveLookup: props.moveLookup,
    findReplaces: props.findReplaces,
    collapsedFileIds: new Set(),
    viewedFileIds: new Set(props.record.viewedFileIds),
    comments: props.record.comments,
    cursorRow: 0,
    viewMode: "unified",
    mode: "browse",
    inputBuffer: "",
    commentTargetKey: null,
    searchMatches: [],
    searchActiveIndex: 0,
    statusMessage: null,
    pendingJumpKey: null,
  };
}

const TYPE_MARKER: Record<string, string> = { add: "+", del: "-", context: " " };
const TYPE_COLOR: Record<string, string> = { add: "green", del: "red", context: "gray" };

function LineRow({ row, active }: { row: Extract<TuiRow, { kind: "line" }>; active: boolean }) {
  const color = TYPE_COLOR[row.type];
  const marker = TYPE_MARKER[row.type];
  return (
    <Text backgroundColor={active ? "blueBright" : undefined} color={active ? "black" : color}>
      {"  "}
      {marker} {row.content}
      {row.moveInfo?.isFirstInRun
        ? `  ↔ moved (${row.moveInfo.lineCount} line${row.moveInfo.lineCount === 1 ? "" : "s"})`
        : ""}
    </Text>
  );
}

function SplitSideText({ side, active, width }: { side: TuiSplitSide | null; active: boolean; width: number }) {
  if (!side) {
    return (
      <Box width={width}>
        <Text> </Text>
      </Box>
    );
  }
  const color = TYPE_COLOR[side.type];
  const marker = TYPE_MARKER[side.type];
  return (
    <Box width={width}>
      <Text backgroundColor={active ? "blueBright" : undefined} color={active ? "black" : color} wrap="truncate-end">
        {marker} {side.content}
        {side.moveInfo?.isFirstInRun ? `  ↔ moved (${side.moveInfo.lineCount})` : ""}
      </Text>
    </Box>
  );
}

export default function App(props: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, dispatch] = useReducer(reducer, props, initialState);

  const rows = useMemo(
    () => currentRows(state),
    [state.diff, state.collapsedFileIds, state.viewedFileIds, state.moveLookup, state.viewMode],
  );
  const termWidth = stdout?.columns ?? 80;
  const columnWidth = Math.max(Math.floor(termWidth / 2) - 1, 10);

  // Mirrors the browser's search/find-replace jump effect: expand the
  // target file first if it's collapsed, then resolve the row once the
  // rows list reflects that (see App.tsx's search-jump / FindReplaceSummary
  // effects in the browser UI for the same pattern).
  useEffect(() => {
    if (!state.pendingJumpKey) return;
    const fileId = jumpKeyFileId(state.pendingJumpKey);
    if (state.collapsedFileIds.has(fileId)) {
      dispatch({ type: "REQUEST_EXPAND_FOR_JUMP", fileId });
      return;
    }
    const index = resolveJumpRow(rows, state.pendingJumpKey);
    if (index >= 0) dispatch({ type: "SET_CURSOR", row: index });
    dispatch({ type: "CLEAR_PENDING_JUMP" });
  }, [state.pendingJumpKey, state.collapsedFileIds, rows]);

  const termHeight = stdout?.rows ?? 24;
  const chrome = 5; // title line + find/replace banner + status/footer line + spacing
  const viewportHeight = Math.max(termHeight - chrome, 5);
  const cursorRow = Math.min(state.cursorRow, Math.max(rows.length - 1, 0));
  const scrollOffset = Math.min(
    Math.max(cursorRow - Math.floor(viewportHeight / 2), 0),
    Math.max(rows.length - viewportHeight, 0),
  );
  const visibleRows = rows.slice(scrollOffset, scrollOffset + viewportHeight);

  useInput((input, key) => {
    if (state.mode === "search" || state.mode === "comment") {
      if (key.escape) {
        dispatch({ type: "EXIT_MODE" });
        return;
      }
      if (key.return) {
        if (state.mode === "search") {
          const matches = buildSearchMatches(state.diff, state.inputBuffer, true);
          dispatch({
            type: "SUBMIT_SEARCH",
            matches,
            pendingJumpKey: matches.length > 0 ? matchToKey(matches[0]) : null,
          });
        } else {
          dispatch({ type: "SUBMIT_COMMENT" });
        }
        return;
      }
      if (key.backspace || key.delete) {
        dispatch({ type: "INPUT_BACKSPACE" });
        return;
      }
      if (input) dispatch({ type: "INPUT_CHAR", char: input });
      return;
    }

    if (state.mode === "help") {
      dispatch({ type: "TOGGLE_HELP" });
      return;
    }

    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
      return;
    }
    if (input === "j" || key.downArrow) {
      dispatch({ type: "MOVE_CURSOR", delta: 1, rowCount: rows.length });
      return;
    }
    if (input === "k" || key.upArrow) {
      dispatch({ type: "MOVE_CURSOR", delta: -1, rowCount: rows.length });
      return;
    }
    if (key.pageDown || input === " ") {
      dispatch({ type: "MOVE_CURSOR", delta: viewportHeight, rowCount: rows.length });
      return;
    }
    if (key.pageUp) {
      dispatch({ type: "MOVE_CURSOR", delta: -viewportHeight, rowCount: rows.length });
      return;
    }
    if (input === "/") {
      dispatch({ type: "ENTER_SEARCH" });
      return;
    }
    if (input === "n") {
      dispatch({ type: "JUMP_TO_MATCH", direction: 1 });
      return;
    }
    if (input === "N") {
      dispatch({ type: "JUMP_TO_MATCH", direction: -1 });
      return;
    }
    if (input === "c") {
      const row = rows[cursorRow];
      if (row) dispatch({ type: "TOGGLE_COLLAPSE", fileId: row.fileId });
      return;
    }
    if (input === "v") {
      const row = rows[cursorRow];
      if (row) dispatch({ type: "TOGGLE_VIEWED", fileId: row.fileId });
      return;
    }
    if (input === "m") {
      const row = rows[cursorRow];
      const key = row?.kind === "line" ? row.matchKey : row?.kind === "split-line" ? (row.right ?? row.left)?.matchKey : null;
      if (key) dispatch({ type: "ENTER_COMMENT", lineKey: key, initialText: state.comments[key] ?? "" });
      return;
    }
    if (input === "d") {
      const row = rows[cursorRow];
      const key = row?.kind === "line" ? row.matchKey : row?.kind === "split-line" ? (row.right ?? row.left)?.matchKey : null;
      if (key && state.comments[key]) {
        dispatch({ type: "ENTER_COMMENT", lineKey: key, initialText: state.comments[key] });
        dispatch({ type: "DELETE_COMMENT" });
      }
      return;
    }
    if (input === "s") {
      if (state.viewMode === "unified" && termWidth < MIN_SPLIT_COLUMNS) {
        dispatch({ type: "SET_STATUS", message: `Terminal too narrow for split view (need ${MIN_SPLIT_COLUMNS}+ columns)` });
        return;
      }
      dispatch({ type: "TOGGLE_VIEW_MODE" });
      return;
    }
    if (input === "?") {
      dispatch({ type: "TOGGLE_HELP" });
    }
  });

  if (state.mode === "help") {
    return (
      <Box flexDirection="column" borderStyle="round" padding={1}>
        <Text bold>Diffly — keyboard help</Text>
        <Text>j/k or arrows   move cursor      space / PgDn / PgUp   page</Text>
        <Text>c   collapse/expand file          v   mark file viewed</Text>
        <Text>m   add/edit comment on line      d   delete comment on line</Text>
        <Text>/   search                        n / N   next / previous match</Text>
        <Text>s   toggle unified / split view   q   quit</Text>
        <Text>?   toggle this help</Text>
        <Text color="gray">Press any key to close</Text>
      </Box>
    );
  }

  const totalAdd = state.diff.files.reduce((sum, f) => sum + f.additions, 0);
  const totalDel = state.diff.files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Diffly — {props.sourceLabel} · {state.diff.files.length} file{state.diff.files.length === 1 ? "" : "s"}{" "}
        changed <Text color="green">+{totalAdd}</Text> <Text color="red">-{totalDel}</Text>
      </Text>
      {state.findReplaces.length > 0 && (
        <Text color="yellow">
          Find/Replace:{" "}
          {state.findReplaces.map((fr) => `${fr.oldText} → ${fr.newText} (${fr.occurrences.length}x)`).join("  ")}
        </Text>
      )}
      <Box flexDirection="column">
        {visibleRows.map((row, i) => {
          const absoluteIndex = scrollOffset + i;
          const active = absoluteIndex === cursorRow;
          if (row.kind === "file-header") {
            return (
              <Text key={`h-${row.fileId}`} bold backgroundColor={active ? "blueBright" : undefined}>
                {row.collapsed ? "▸" : "▾"} {row.viewed ? "✓ " : "  "}
                {row.label} <Text color="green">+{row.additions}</Text> <Text color="red">-{row.deletions}</Text>
              </Text>
            );
          }
          if (row.kind === "hunk-header") {
            return (
              <Text key={`hh-${row.fileId}-${i}`} color="cyan" backgroundColor={active ? "blueBright" : undefined}>
                {row.header}
              </Text>
            );
          }
          if (row.kind === "binary") {
            return (
              <Text key={`b-${row.fileId}`} color="gray">
                (binary file, no preview)
              </Text>
            );
          }
          if (row.kind === "split-line") {
            const commentKey = (row.right ?? row.left)?.matchKey;
            return (
              <Box key={`${row.left?.matchKey ?? "x"}-${row.right?.matchKey ?? "x"}`} flexDirection="column">
                <Box>
                  <SplitSideText side={row.left} active={active} width={columnWidth} />
                  <SplitSideText side={row.right} active={active} width={columnWidth} />
                </Box>
                {commentKey && state.comments[commentKey] && (
                  <Text color="magenta"> ↳ {state.comments[commentKey]}</Text>
                )}
              </Box>
            );
          }
          return (
            <Box key={row.matchKey} flexDirection="column">
              <LineRow row={row} active={active} />
              {state.comments[row.matchKey] && <Text color="magenta"> ↳ {state.comments[row.matchKey]}</Text>}
            </Box>
          );
        })}
      </Box>
      <Box>
        {state.mode === "search" ? (
          <Text>Search: {state.inputBuffer}_</Text>
        ) : state.mode === "comment" ? (
          <Text>Comment: {state.inputBuffer}_</Text>
        ) : (
          <Text color="gray">
            {state.statusMessage ??
              `j/k move · c collapse · v viewed · m comment · / search · s ${state.viewMode === "unified" ? "split" : "unified"} · ? help · q quit`}
          </Text>
        )}
      </Box>
    </Box>
  );
}
