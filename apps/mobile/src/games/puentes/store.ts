/** Copia de apps/web/src/games/puentes/store.ts: partida en curso de Puentes (motor en @cranea/core). */
import { create } from "zustand";
import { crossingMap, isSolved, type PuentesPuzzle } from "@cranea/core/puentes";

/** Respuesta a la última acción, para el mensaje debajo del tablero. */
export type Notice =
  | { kind: "blocked" }
  | { kind: "wrong"; count: number }
  | { kind: "ok"; missing: number }
  | null;

interface PuentesSession {
  puzzle: PuentesPuzzle | null;
  crossings: number[][];
  bridges: number[];
  history: number[][];
  status: "playing" | "won";
  /** Revisiones que encontraron puentes de más. */
  mistakes: number;
  /** Conexiones marcadas en rojo por la última revisión. */
  wrong: number[];
  notice: Notice;
  selected: number | null;
  startedAt: number;
  finishedAt: number | null;
  start: (p: PuentesPuzzle) => void;
  cycle: (edge: number) => void;
  select: (island: number | null) => void;
  undo: () => void;
  reset: () => void;
  check: () => void;
}

const fresh = (p: PuentesPuzzle) => ({
  puzzle: p,
  crossings: crossingMap(p.islands, p.edges),
  bridges: p.edges.map(() => 0),
  history: [],
  mistakes: 0,
  wrong: [],
  notice: null,
  selected: null,
  finishedAt: null,
});

export const usePuentes = create<PuentesSession>((set, get) => ({
  puzzle: null,
  crossings: [],
  bridges: [],
  history: [],
  status: "playing",
  mistakes: 0,
  wrong: [],
  notice: null,
  selected: null,
  startedAt: 0,
  finishedAt: null,

  start: (p) => set({ ...fresh(p), status: "playing", startedAt: Date.now() }),

  /** 0 → 1 → 2 → 0. Un puente que cortaría a otro no se tiende (no cuenta como error). */
  cycle: (edge) => {
    const { puzzle, bridges, crossings, history, status } = get();
    if (!puzzle || status !== "playing" || edge < 0 || edge >= bridges.length) return;
    if (bridges[edge] === 0 && crossings[edge].some((f) => bridges[f] > 0)) {
      set({ notice: { kind: "blocked" }, selected: null });
      return;
    }
    const next = bridges.slice();
    next[edge] = (next[edge] + 1) % 3;
    const won = isSolved(puzzle.islands, puzzle.edges, next);
    set({
      bridges: next,
      history: [...history, bridges],
      wrong: [],
      notice: null,
      selected: null,
      status: won ? "won" : "playing",
      finishedAt: won ? Date.now() : null,
    });
  },

  select: (island) => {
    if (get().status === "playing") set({ selected: island });
  },

  undo: () => {
    const { history, status } = get();
    if (status !== "playing" || history.length === 0) return;
    set({ bridges: history[history.length - 1], history: history.slice(0, -1), wrong: [], notice: null, selected: null });
  },

  reset: () => {
    const { bridges, history, status } = get();
    if (status !== "playing" || bridges.every((b) => b === 0)) return;
    set({ bridges: bridges.map(() => 0), history: [...history, bridges], wrong: [], notice: null, selected: null });
  },

  /** Marca los puentes que sobran respecto de la solución. Si hay alguno, suma un error. */
  check: () => {
    const { puzzle, bridges, status, mistakes } = get();
    if (!puzzle || status !== "playing") return;
    const wrong = bridges.flatMap((b, i) => (b > puzzle.solution[i] ? [i] : []));
    if (wrong.length) {
      set({ wrong, mistakes: mistakes + 1, notice: { kind: "wrong", count: wrong.reduce((n, i) => n + bridges[i] - puzzle.solution[i], 0) }, selected: null });
      return;
    }
    const missing = puzzle.solution.reduce((n, s, i) => n + s - bridges[i], 0);
    set({ wrong: [], notice: { kind: "ok", missing }, selected: null });
  },
}));

/** Intentos para el progreso: 1 + revisiones con errores (igual que la web). */
export const attemptsOf = (mistakes: number) => 1 + mistakes;
