import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { hashDiffText, loadDiffRecord, writeDiffRecord } from "../lib/comments";
import { loadDiffText } from "../lib/ingestDiff";
import { buildSearchMatches } from "../lib/search";
import { getInitialTheme, writeStoredTheme } from "../lib/theme";
import type { DiffRecord, ParsedDiff, SearchMatch, Theme, ViewMode } from "../types";

interface SearchState {
  query: string;
  includeFilenames: boolean;
  matches: SearchMatch[];
  activeIndex: number;
}

interface AppState {
  diff: ParsedDiff | null;
  diffId: string | null;
  sourceLabel: string | null;
  loadError: string | null;
  viewMode: ViewMode;
  theme: Theme;
  collapsedFileIds: Set<string>;
  viewedFileIds: Set<string>;
  comments: Record<string, string>;
  search: SearchState;
}

type Action =
  | { type: "LOAD_DIFF_SUCCESS"; diff: ParsedDiff; sourceLabel: string | null; diffId: string; record: DiffRecord }
  | { type: "LOAD_DIFF_ERROR"; error: string }
  | { type: "CLEAR_DIFF" }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "SET_THEME"; theme: Theme }
  | { type: "TOGGLE_FILE_COLLAPSED"; fileId: string }
  | { type: "SET_ALL_COLLAPSED"; collapsed: boolean; fileIds: string[] }
  | { type: "TOGGLE_FILE_VIEWED"; fileId: string }
  | { type: "SET_ALL_VIEWED"; viewed: boolean; fileIds: string[] }
  | { type: "SET_COMMENT"; lineKey: string; text: string }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_SEARCH_SCOPE"; includeFilenames: boolean }
  | { type: "NEXT_MATCH" }
  | { type: "PREV_MATCH" };

const initialSearch: SearchState = {
  query: "",
  includeFilenames: true,
  matches: [],
  activeIndex: 0,
};

function initialState(): AppState {
  return {
    diff: null,
    diffId: null,
    sourceLabel: null,
    loadError: null,
    viewMode: "unified",
    theme: getInitialTheme(),
    collapsedFileIds: new Set(),
    viewedFileIds: new Set(),
    comments: {},
    search: initialSearch,
  };
}

function recomputeMatches(diff: ParsedDiff | null, search: SearchState): SearchState {
  if (!diff) return { ...search, matches: [], activeIndex: 0 };
  const matches = buildSearchMatches(diff, search.query, search.includeFilenames);
  return { ...search, matches, activeIndex: 0 };
}

function persist(state: AppState, overrides: Partial<Pick<AppState, "comments" | "viewedFileIds">>): void {
  if (!state.diffId) return;
  const comments = overrides.comments ?? state.comments;
  const viewedFileIds = overrides.viewedFileIds ?? state.viewedFileIds;
  writeDiffRecord(state.diffId, { comments, viewedFileIds: Array.from(viewedFileIds) });
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD_DIFF_SUCCESS": {
      const viewedFileIds = new Set(action.record.viewedFileIds);
      return {
        ...state,
        diff: action.diff,
        diffId: action.diffId,
        sourceLabel: action.sourceLabel,
        loadError: null,
        // Files already marked "viewed" the last time this exact diff was
        // opened start collapsed again too, mirroring GitHub's PR behavior.
        collapsedFileIds: new Set(viewedFileIds),
        viewedFileIds,
        comments: action.record.comments,
        search: recomputeMatches(action.diff, { ...initialSearch }),
      };
    }
    case "LOAD_DIFF_ERROR":
      return { ...state, loadError: action.error };
    case "CLEAR_DIFF":
      return {
        ...state,
        diff: null,
        diffId: null,
        sourceLabel: null,
        loadError: null,
        collapsedFileIds: new Set(),
        viewedFileIds: new Set(),
        comments: {},
        search: initialSearch,
      };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };
    case "SET_THEME":
      writeStoredTheme(action.theme);
      return { ...state, theme: action.theme };
    case "TOGGLE_FILE_COLLAPSED": {
      const next = new Set(state.collapsedFileIds);
      if (next.has(action.fileId)) next.delete(action.fileId);
      else next.add(action.fileId);
      return { ...state, collapsedFileIds: next };
    }
    case "SET_ALL_COLLAPSED":
      return {
        ...state,
        collapsedFileIds: action.collapsed ? new Set(action.fileIds) : new Set(),
      };
    case "TOGGLE_FILE_VIEWED": {
      const viewedFileIds = new Set(state.viewedFileIds);
      const collapsedFileIds = new Set(state.collapsedFileIds);
      if (viewedFileIds.has(action.fileId)) {
        viewedFileIds.delete(action.fileId);
        collapsedFileIds.delete(action.fileId);
      } else {
        viewedFileIds.add(action.fileId);
        collapsedFileIds.add(action.fileId);
      }
      persist(state, { viewedFileIds });
      return { ...state, viewedFileIds, collapsedFileIds };
    }
    case "SET_ALL_VIEWED": {
      // Mirrors the single-file toggle's collapse behavior, but only for the
      // affected ids — leaves any unrelated manual collapses untouched.
      const collapsedFileIds = new Set(state.collapsedFileIds);
      for (const id of action.fileIds) {
        if (action.viewed) collapsedFileIds.add(id);
        else collapsedFileIds.delete(id);
      }
      const viewedFileIds = action.viewed ? new Set(action.fileIds) : new Set<string>();
      persist(state, { viewedFileIds });
      return { ...state, viewedFileIds, collapsedFileIds };
    }
    case "SET_COMMENT": {
      const comments = { ...state.comments };
      if (action.text.trim() === "") {
        delete comments[action.lineKey];
      } else {
        comments[action.lineKey] = action.text;
      }
      persist(state, { comments });
      return { ...state, comments };
    }
    case "SET_SEARCH_QUERY":
      return { ...state, search: recomputeMatches(state.diff, { ...state.search, query: action.query }) };
    case "SET_SEARCH_SCOPE":
      return {
        ...state,
        search: recomputeMatches(state.diff, { ...state.search, includeFilenames: action.includeFilenames }),
      };
    case "NEXT_MATCH": {
      const { matches, activeIndex } = state.search;
      if (matches.length === 0) return state;
      return { ...state, search: { ...state.search, activeIndex: (activeIndex + 1) % matches.length } };
    }
    case "PREV_MATCH": {
      const { matches, activeIndex } = state.search;
      if (matches.length === 0) return state;
      return {
        ...state,
        search: { ...state.search, activeIndex: (activeIndex - 1 + matches.length) % matches.length },
      };
    }
    default:
      return state;
  }
}

interface DiffContextValue {
  state: AppState;
  loadDiff: (text: string, sourceLabel: string | null) => void;
  clearDiff: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleTheme: () => void;
  toggleFileCollapsed: (fileId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  toggleFileViewed: (fileId: string) => void;
  markAllViewed: (viewed: boolean) => void;
  setComment: (lineKey: string, text: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchScope: (includeFilenames: boolean) => void;
  nextMatch: () => void;
  prevMatch: () => void;
}

const DiffContext = createContext<DiffContextValue | null>(null);

export function DiffProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const loadDiff = useCallback((text: string, sourceLabel: string | null) => {
    const result = loadDiffText(text);
    if (result.ok) {
      const diffId = hashDiffText(text);
      const record = loadDiffRecord(diffId);
      dispatch({ type: "LOAD_DIFF_SUCCESS", diff: result.diff, sourceLabel, diffId, record });
    } else {
      dispatch({ type: "LOAD_DIFF_ERROR", error: result.error });
    }
  }, []);

  const clearDiff = useCallback(() => dispatch({ type: "CLEAR_DIFF" }), []);
  const setViewMode = useCallback((mode: ViewMode) => dispatch({ type: "SET_VIEW_MODE", mode }), []);
  const toggleTheme = useCallback(() => {
    dispatch({ type: "SET_THEME", theme: state.theme === "dark" ? "light" : "dark" });
  }, [state.theme]);
  const toggleFileCollapsed = useCallback(
    (fileId: string) => dispatch({ type: "TOGGLE_FILE_COLLAPSED", fileId }),
    [],
  );
  const expandAll = useCallback(() => {
    dispatch({ type: "SET_ALL_COLLAPSED", collapsed: false, fileIds: [] });
  }, []);
  const collapseAll = useCallback(() => {
    dispatch({
      type: "SET_ALL_COLLAPSED",
      collapsed: true,
      fileIds: state.diff?.files.map((file) => file.id) ?? [],
    });
  }, [state.diff]);
  const toggleFileViewed = useCallback(
    (fileId: string) => dispatch({ type: "TOGGLE_FILE_VIEWED", fileId }),
    [],
  );
  const markAllViewed = useCallback(
    (viewed: boolean) => {
      dispatch({ type: "SET_ALL_VIEWED", viewed, fileIds: state.diff?.files.map((file) => file.id) ?? [] });
    },
    [state.diff],
  );
  const setComment = useCallback(
    (lineKey: string, text: string) => dispatch({ type: "SET_COMMENT", lineKey, text }),
    [],
  );
  const setSearchQuery = useCallback((query: string) => dispatch({ type: "SET_SEARCH_QUERY", query }), []);
  const setSearchScope = useCallback(
    (includeFilenames: boolean) => dispatch({ type: "SET_SEARCH_SCOPE", includeFilenames }),
    [],
  );
  const nextMatch = useCallback(() => dispatch({ type: "NEXT_MATCH" }), []);
  const prevMatch = useCallback(() => dispatch({ type: "PREV_MATCH" }), []);

  const value = useMemo<DiffContextValue>(
    () => ({
      state,
      loadDiff,
      clearDiff,
      setViewMode,
      toggleTheme,
      toggleFileCollapsed,
      expandAll,
      collapseAll,
      toggleFileViewed,
      markAllViewed,
      setComment,
      setSearchQuery,
      setSearchScope,
      nextMatch,
      prevMatch,
    }),
    [
      state,
      loadDiff,
      clearDiff,
      setViewMode,
      toggleTheme,
      toggleFileCollapsed,
      expandAll,
      collapseAll,
      toggleFileViewed,
      markAllViewed,
      setComment,
      setSearchQuery,
      setSearchScope,
      nextMatch,
      prevMatch,
    ],
  );

  return <DiffContext.Provider value={value}>{children}</DiffContext.Provider>;
}

export function useDiff(): DiffContextValue {
  const ctx = useContext(DiffContext);
  if (!ctx) throw new Error("useDiff must be used within a DiffProvider");
  return ctx;
}
