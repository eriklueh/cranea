"use client";
import { create } from "zustand";
import {
  applyStroke,
  emptyBoard,
  isSolved,
  mistakes,
  strokeAction,
  strokeCells,
  type Cell,
  type NonogramaPuzzle,
  type StrokeAction,
  type Tool,
} from "@cranea/core/nonograma";

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
  start: (p: NonogramaPuzzle) => void;
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

export const attemptsOf = (s: { status: NonogramaSession["status"]; checks: number }) => (s.status === "lost" ? MAX_ATTEMPTS : s.checks + 1);

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

  start: (puzzle) =>
    set({ puzzle, board: emptyBoard(puzzle), history: [], tool: "fill", stroke: null, cursor: null, status: "playing", checks: 0, flagged: [], lastCheck: null, startedAt: Date.now(), finishedAt: null }),

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
    else set({ stroke: null, history: nextHistory });
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
