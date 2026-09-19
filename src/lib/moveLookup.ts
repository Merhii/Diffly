import type { MoveOperation } from "../types";

export interface MoveCounterpart {
  counterpartKeys: string[];
  lineCount: number;
  /** Only the first line of a moved run shows the badge — the rest just get the border/background treatment, so an N-line move doesn't repeat the label N times. */
  isFirstInRun: boolean;
}

/**
 * Flattens the engine's from/to key arrays into a single lookup so any line
 * can cheaply check "am I part of a move, and if so where's the other end" —
 * covers both directions (a line in fromKeys maps to toKeys and vice versa).
 */
export function buildMoveLookup(moves: MoveOperation[]): Map<string, MoveCounterpart> {
  const map = new Map<string, MoveCounterpart>();

  for (const move of moves) {
    move.fromKeys.forEach((key, index) => {
      map.set(key, { counterpartKeys: move.toKeys, lineCount: move.lineCount, isFirstInRun: index === 0 });
    });
    move.toKeys.forEach((key, index) => {
      map.set(key, { counterpartKeys: move.fromKeys, lineCount: move.lineCount, isFirstInRun: index === 0 });
    });
  }

  return map;
}
