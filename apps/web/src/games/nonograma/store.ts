"use client";
import { create } from "zustand";
import {
  applyStroke,
  emptyBoard,
  hintKey,
  hintResolved,
  isSolved,
  mistakes,
  strokeAction,
  strokeCells,
  type Cell,
  type NonogramaHint,
  type NonogramaPuzzle,
  type StrokeAction,
  type Tool,
} from "@cranea/core/nonograma";

/** Pista abierta: qué dice (calculada al pedirla, con el tablero de ese momento), su clave y cuánto se reveló. */
export interface Hint {
  info: NonogramaHint;
  key: number;
  level: 1 | 2;
}

/** Intentos = 1 + revisiones usadas. Con dos revisiones se llega al máximo de tres, como en Cifra. */
export const MAX_ATTEMPTS = 3;
export const MAX_CHECKS = MAX_ATTEMPTS - 1;
const MAX_HISTORY = 200;

interface Stroke {
  start: number;
  base: Cell[];
  action: StrokeAction;
}

interface NonogramaSession {
  puzzle: NonogramaPuzzle | null;
  board: Cell[];
  history: Cell[][];
  tool: Tool;
  stroke: Stroke | null;
  /** Casilla con el foco del teclado (y la última tocada). */
  cursor: number | null;
  status: "playing" | "won" | "lost";
  checks: number;
  /** Casillas señaladas por la última revisión. Se limpian con el siguiente trazo. */
  flagged: number[];
  /** Resultado de la última revisión, para avisar con texto. */
  lastCheck: number | null;
  startedAt: number;
  finishedAt: number | null;
  hint: Hint | null;
  /** Veces que se mostró una pista (como Cifra). Se ve en el resultado; no cambia el puntaje. */
  hintsUsed: number;
  start: (p: NonogramaPuzzle) => void;
  /** Primer toque: la línea; otro toque sobre la misma pista: la deducción. Nunca toca el tablero. */
  showHint: (info: NonogramaHint) => void;
  closeHint: () => void;
  setTool: (t: Tool) => void;
  setCursor: (i: number) => void;
  beginStroke: (i: number, tool?: Tool) => void;
  moveStroke: (i: number) => void;
  endStroke: () => void;
  undo: () => void;
  reset: () => void;
  check: () => void;
  giveUp: () => void;
}

/** Cuando el tablero ya muestra lo que decía la pista (o se corrigió el error), se cierra sola. */
const closeIfResolved = (hint: Hint | null, puzzle: NonogramaPuzzle, board: readonly Cell[]) => (hint && hintResolved(hint.info, puzzle, board) ? { hint: null } : {});

export const attemptsOf =(s: { status: NonogramaSession["status"]; checks: number }) => (s.status === "lost" ? MAX_ATTEMPTS : s.checks + 1);

export const useNonograma = create<NonogramaSession>((set, get) => ({
  puzzle: null,
  board: [],
  history: [],
  tool: "fill",
  stroke: null,
  cursor: null,
  status: "playing",
  checks: 0,
  flagged: [],
  lastCheck: null,
  startedAt: 0,
  finishedAt: null,
  hint: null,
  hintsUsed: 0,

  start: (puzzle) =>
    set({ puzzle, board: emptyBoard(puzzle), history: [], tool: "fill", stroke: null, cursor: null, status: "playing", checks: 0, flagged: [], lastCheck: null, startedAt: Date.now(), finishedAt: null, hint: null, hintsUsed: 0 }),

  showHint: (info) => {
    const { hint, hintsUsed, status } = get();
    if (status !== "playing") return;
    const key = hintKey(info);
    if (hint?.key === key) {
      if (hint.level === 1) set({ hint: { info, key, level: 2 }, hintsUsed: hintsUsed + 1 });
      return;
    }
    set({ hint: { info, key, level: 1 }, hintsUsed: hintsUsed + 1 });
  },

  closeHint: () => set({ hint: null }),

  setTool: (tool) => set({ tool }),

  setCursor: (cursor) => set({ cursor }),

  beginStroke: (i, tool) => {
    const { puzzle, board, status } = get();
    if (!puzzle || status !== "playing" || i < 0 || i >= board.length) return;
    const action = strokeAction(board, i, tool ?? get().tool);
    set({ stroke: { start: i, base: board, action }, board: applyStroke(board, [i], action), cursor: i, flagged: [], lastCheck: null });
  },

  moveStroke: (i) => {
    const { puzzle, stroke } = get();
    if (!puzzle || !stroke) return;
    set({ board: applyStroke(stroke.base, strokeCells(puzzle.width, stroke.start, i), stroke.action), cursor: i });
  },

  endStroke: () => {
    const { puzzle, stroke, board, history } = get();
    if (!puzzle || !stroke) return;
    const changed = board.some((c, i) => c !== stroke.base[i]);
    if (!changed) return set({ stroke: null });
    const nextHistory = [...history, stroke.base].slice(-MAX_HISTORY);
    if (isSolved(board, puzzle)) set({ stroke: null, history: nextHistory, status: "won", finishedAt: Date.now() });
    else set({ stroke: null, history: nextHistory, ...closeIfResolved(get().hint, puzzle, board) });
  },

  undo: () => {
    const { history, status, stroke } = get();
    if (status !== "playing" || stroke || !history.length) return;
    set({ board: history[history.length - 1], history: history.slice(0, -1), flagged: [], lastCheck: null });
  },

  reset: () => {
    const { puzzle, board, history, status } = get();
    if (!puzzle || status !== "playing" || board.every((c) => c === 0)) return;
    // Empezar de nuevo también se puede deshacer.
    set({ board: emptyBoard(puzzle), history: [...history, board].slice(-MAX_HISTORY), flagged: [], lastCheck: null, stroke: null });
  },

  check: () => {
    const { puzzle, board, status, checks } = get();
    if (!puzzle || status !== "playing" || checks >= MAX_CHECKS) return;
    const wrong = mistakes(board, puzzle);
    set({ checks: checks + 1, flagged: wrong, lastCheck: wrong.length });
  },

  giveUp: () => {
    const { puzzle, status } = get();
    if (!puzzle || status !== "playing") return;
    set({ status: "lost", finishedAt: Date.now(), stroke: null, flagged: [] });
  },
}));
