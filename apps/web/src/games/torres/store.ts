"use client";
import { create } from "zustand";
import { isSolved, type TorresPuzzle } from "@cranea/core/torres";

/**
 * Intentos = 1 + comprobaciones fallidas. "Comprobar" revisa lo escrito contra la solución;
 * si algo está mal, marca esas casillas y gasta un intento. Con 3 fallidas la partida se pierde.
 * Completar el tablero sin conflictos es ganar: con solución única, no hay otra forma de llenarlo.
 */
export const MAX_ATTEMPTS = 3;

interface Snapshot {
  values: number[];
  /** Notas de lápiz por casilla: bit v-1 = altura v. */
  notes: number[];
}

export type CheckResult = { kind: "ok" | "wrong"; key: number } | null;

interface TorresSession extends Snapshot {
  puzzle: TorresPuzzle | null;
  selected: number | null;
  notesMode: boolean;
  history: Snapshot[];
  mistakes: number;
  /** Casillas marcadas como incorrectas por la última comprobación, hasta que se editen. */
  wrong: number[];
  check: CheckResult;
  status: "playing" | "won" | "lost";
  startedAt: number;
  finishedAt: number | null;
  start: (p: TorresPuzzle) => void;
  select: (cell: number) => void;
  move: (dr: number, dc: number) => void;
  input: (v: number, asNote?: boolean) => void;
  erase: () => void;
  toggleNotesMode: () => void;
  undo: () => void;
  reset: () => void;
  runCheck: () => void;
}

const HISTORY_LIMIT = 300;

export const useTorres = create<TorresSession>((set, get) => {
  /** Aplica un cambio guardando el estado anterior para poder deshacerlo. */
  const commit = (next: Partial<Snapshot>, extra: Partial<TorresSession> = {}) => {
    const { values, notes, history, puzzle } = get();
    const nextValues = next.values ?? values;
    const won = puzzle !== null && nextValues.every(Boolean) && isSolved(nextValues, puzzle.size, puzzle.clues, puzzle.givens);
    set({
      ...next,
      ...extra,
      history: [...history, { values, notes }].slice(-HISTORY_LIMIT),
      ...(won ? { status: "won" as const, finishedAt: Date.now(), wrong: [], check: null } : {}),
    });
  };
  const editable = (cell: number | null): cell is number => {
    const { puzzle, status } = get();
    return puzzle !== null && status === "playing" && cell !== null && !puzzle.givens[cell];
  };

  return {
    puzzle: null,
    values: [],
    notes: [],
    selected: null,
    notesMode: false,
    history: [],
    mistakes: 0,
    wrong: [],
    check: null,
    status: "playing",
    startedAt: 0,
    finishedAt: null,

    start: (puzzle) =>
      set({
        puzzle,
        values: puzzle.givens.slice(),
        notes: new Array<number>(puzzle.size * puzzle.size).fill(0),
        selected: Math.max(0, puzzle.givens.findIndex((g) => !g)),
        notesMode: false,
        history: [],
        mistakes: 0,
        wrong: [],
        check: null,
        status: "playing",
        startedAt: Date.now(),
        finishedAt: null,
      }),

    select: (cell) => {
      const { puzzle, status } = get();
      if (puzzle && status === "playing" && Number.isInteger(cell) && cell >= 0 && cell < puzzle.size * puzzle.size) set({ selected: cell });
    },

    move: (dr, dc) => {
      const { puzzle, selected, status } = get();
      if (!puzzle || status !== "playing") return;
      const n = puzzle.size;
      const from = selected ?? 0;
      const r = (Math.floor(from / n) + dr + n) % n;
      const c = ((from % n) + dc + n) % n;
      set({ selected: r * n + c });
    },

    input: (v, asNote) => {
      const { puzzle, selected, values, notes, notesMode, wrong } = get();
      if (!editable(selected) || !puzzle || v < 1 || v > puzzle.size) return;
      if (asNote ?? notesMode) {
        if (values[selected]) return;
        const next = notes.slice();
        next[selected] ^= 1 << (v - 1);
        commit({ notes: next });
        return;
      }
      const next = values.slice();
      next[selected] = values[selected] === v ? 0 : v;
      commit({ values: next }, { wrong: wrong.filter((c) => c !== selected), check: null });
    },

    erase: () => {
      const { selected, values, notes, wrong } = get();
      if (!editable(selected) || (!values[selected] && !notes[selected])) return;
      if (values[selected]) {
        const next = values.slice();
        next[selected] = 0;
        commit({ values: next }, { wrong: wrong.filter((c) => c !== selected), check: null });
      } else {
        const next = notes.slice();
        next[selected] = 0;
        commit({ notes: next });
      }
    },

    toggleNotesMode: () => set((s) => ({ notesMode: !s.notesMode })),

    undo: () => {
      const { history, status } = get();
      if (status !== "playing" || history.length === 0) return;
      set({ ...history[history.length - 1], history: history.slice(0, -1), wrong: [], check: null });
    },

    reset: () => {
      const { puzzle, values, notes, status } = get();
      if (!puzzle || status !== "playing") return;
      if (values.every((v, i) => v === puzzle.givens[i]) && notes.every((n) => !n)) return;
      commit({ values: puzzle.givens.slice(), notes: new Array<number>(notes.length).fill(0) }, { wrong: [], check: null });
    },

    runCheck: () => {
      const { puzzle, values, status, mistakes, check } = get();
      if (!puzzle || status !== "playing") return;
      const filled = values.flatMap((v, i) => (v && !puzzle.givens[i] ? [i] : []));
      if (filled.length === 0) return;
      const wrong = filled.filter((i) => values[i] !== puzzle.solution[i]);
      const key = (check?.key ?? 0) + 1;
      if (wrong.length === 0) {
        set({ check: { kind: "ok", key }, wrong: [] });
        return;
      }
      const next = mistakes + 1;
      const lost = next >= MAX_ATTEMPTS;
      set({
        mistakes: next,
        wrong,
        check: { kind: "wrong", key },
        ...(lost ? { status: "lost" as const, finishedAt: Date.now() } : {}),
      });
    },
  };
});

/** Intentos de una partida terminada, como los guarda el progreso. */
export const attemptsOf = (status: "playing" | "won" | "lost", mistakes: number) => (status === "won" ? mistakes + 1 : MAX_ATTEMPTS);
