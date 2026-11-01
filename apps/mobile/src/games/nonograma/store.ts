/**
 * Copia de apps/web/src/games/nonograma/store.ts (motor en @cranea/core), más lo propio de la app:
 * cancelar un trazo cuando entra un segundo dedo (zoom), el intento extra de un diario perdido y
 * tapar la solución mientras se ofrece ese intento.
 */
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
import { MAX_ATTEMPTS, MAX_CHECKS } from "./data";

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
  /** Última casilla tocada: resalta su fila y su columna. */
  cursor: number | null;
  status: "playing" | "won" | "lost";
  checks: number;
  /** Casillas señaladas por la última revisión. Se limpian con el siguiente trazo. */
  flagged: number[];
  /** Resultado de la última revisión, para avisar con texto. */
  lastCheck: number | null;
  startedAt: number;
  finishedAt: number | null;
  /** Diario perdido que sigue con un intento extra (anuncio o Plus). */
  extraAttempt: boolean;
  /** Diario perdido con el intento extra en oferta: el tablero no muestra la solución todavía. */
  conceal: boolean;
  start: (p: NonogramaPuzzle) => void;
  setTool: (t: Tool) => void;
  beginStroke: (i: number, tool?: Tool) => void;
  moveStroke: (i: number) => void;
  endStroke: () => void;
  /** Un segundo dedo (zoom): el trazo empezado se deshace sin dejar rastro. */
  cancelStroke: () => void;
  undo: () => void;
  reset: () => void;
  check: () => void;
  /** `conceal`: diario oficial con el intento extra en oferta; la solución queda tapada hasta que se elige. */
  giveUp: (conceal?: boolean) => void;
  setConceal: (conceal: boolean) => void;
  /** Después de rendirse en el diario: seguir con el tablero como estaba. El reloj sigue desde donde quedó. */
  continueWithExtra: () => void;
}

/** Revisiones de la partida: dos, más una si se ganó el intento extra. */
export const checkLimit = (s: Pick<NonogramaSession, "extraAttempt">) => MAX_CHECKS + (s.extraAttempt ? 1 : 0);

/**
 * Intentos para guardar: 1 + revisiones; rendirse cuenta como el máximo. Ganado con el intento extra,
 * uno más que el máximo (así `first` en convex/results.ts lo deja reemplazar a la derrota y el ranking
 * lo cuenta como asistido).
 */
export const attemptsOf = (s: Pick<NonogramaSession, "status" | "checks" | "extraAttempt">) =>
  s.status === "lost" ? MAX_ATTEMPTS : s.extraAttempt ? MAX_ATTEMPTS + 1 : s.checks + 1;

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
  extraAttempt: false,
  conceal: false,

  start: (puzzle) =>
    set({
      puzzle,
      board: emptyBoard(puzzle),
      history: [],
      tool: "fill",
      stroke: null,
      cursor: null,
      status: "playing",
      checks: 0,
      flagged: [],
      lastCheck: null,
      startedAt: Date.now(),
      finishedAt: null,
      extraAttempt: false,
      conceal: false,
    }),

  setTool: (tool) => set({ tool }),

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

  cancelStroke: () => {
    const { stroke } = get();
    if (stroke) set({ board: stroke.base, stroke: null });
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
    if (!puzzle || status !== "playing" || checks >= checkLimit(get())) return;
    const wrong = mistakes(board, puzzle);
    set({ checks: checks + 1, flagged: wrong, lastCheck: wrong.length });
  },

  giveUp: (conceal = false) => {
    const { puzzle, status, stroke, board } = get();
    if (!puzzle || status !== "playing") return;
    set({ status: "lost", finishedAt: Date.now(), stroke: null, board: stroke ? stroke.base : board, flagged: [], lastCheck: null, conceal });
  },

  setConceal: (conceal) => {
    if (get().conceal !== conceal) set({ conceal });
  },

  continueWithExtra: () => {
    const { status, extraAttempt, startedAt, finishedAt } = get();
    if (status !== "lost" || extraAttempt) return;
    // El tiempo en la hoja de resultado y en el anuncio no cuenta.
    const now = Date.now();
    set({ status: "playing", extraAttempt: true, conceal: false, flagged: [], lastCheck: null, startedAt: startedAt + (now - (finishedAt ?? now)), finishedAt: null });
  },
}));
