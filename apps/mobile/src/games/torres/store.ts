import { isSolved, type TorresPuzzle } from "@cranea/core/torres";
import { create } from "zustand";
import { MAX_ATTEMPTS } from "./data";

/**
 * La misma partida que la web (apps/web/src/games/torres/store.ts): intentos = 1 + comprobaciones fallidas.
 * "Comprobar" revisa lo escrito contra la solución; si algo está mal, marca esas casillas y gasta un intento.
 * Con 3 fallidas se pierde. Completar el tablero sin conflictos es ganar (la solución es única).
 * Además, como en Cifra y Palabra de la app: intento extra en un diario perdido, pausa en segundo plano
 * y partida guardada en el dispositivo.
 */

interface Snapshot {
  values: number[];
  /** Notas de lápiz por casilla: bit v-1 = altura v. */
  notes: number[];
}

export type CheckResult = { kind: "ok" | "wrong"; key: number } | null;

/** Lo que se retoma de una partida guardada. */
export interface SavedSession extends Snapshot {
  mistakes: number;
  elapsed: number;
}

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
  /** Cuándo pasó a segundo plano (el reloj no corre). */
  pausedAt: number | null;
  /** Diario perdido que sigue con un intento extra (anuncio o Plus). */
  extraAttempt: boolean;
  start: (p: TorresPuzzle, saved?: SavedSession | null) => void;
  select: (cell: number) => void;
  input: (v: number, asNote?: boolean) => void;
  erase: () => void;
  toggleNotesMode: () => void;
  undo: () => void;
  reset: () => void;
  runCheck: () => void;
  pause: () => void;
  resume: () => void;
  continueWithExtra: () => void;
}

const HISTORY_LIMIT = 300;

/** Comprobaciones fallidas que se pueden gastar: las del juego, más una con el intento extra. */
export const attemptLimit = (s: Pick<TorresSession, "extraAttempt">) => MAX_ATTEMPTS + (s.extraAttempt ? 1 : 0);

/** Intentos de una partida terminada, como los guarda el progreso (igual que la web). */
export const attemptsOf = (status: "playing" | "won" | "lost", mistakes: number) => (status === "won" ? mistakes + 1 : MAX_ATTEMPTS);

/** Tiempo jugado, sin contar el segundo plano. */
export const playedMs = (s: Pick<TorresSession, "startedAt" | "finishedAt" | "pausedAt">, now = Date.now()) =>
  s.startedAt ? Math.max(0, (s.finishedAt ?? s.pausedAt ?? now) - s.startedAt) : 0;

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
    pausedAt: null,
    extraAttempt: false,

    start: (puzzle, saved) =>
      set({
        puzzle,
        values: saved?.values ?? puzzle.givens.slice(),
        notes: saved?.notes ?? new Array<number>(puzzle.size * puzzle.size).fill(0),
        selected: Math.max(0, (saved?.values ?? puzzle.givens).findIndex((v, i) => !v && !puzzle.givens[i])),
        notesMode: false,
        history: [],
        mistakes: saved?.mistakes ?? 0,
        wrong: [],
        check: null,
        status: "playing",
        startedAt: Date.now() - (saved?.elapsed ?? 0),
        finishedAt: null,
        pausedAt: null,
        extraAttempt: false,
      }),

    select: (cell) => {
      const { puzzle, status } = get();
      if (puzzle && status === "playing" && Number.isInteger(cell) && cell >= 0 && cell < puzzle.size * puzzle.size) set({ selected: cell });
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
      const s = get();
      const { puzzle, values, status, mistakes, check } = s;
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
      const lost = next >= attemptLimit(s);
      set({
        mistakes: next,
        wrong,
        check: { kind: "wrong", key },
        ...(lost ? { status: "lost" as const, finishedAt: Date.now() } : {}),
      });
    },

    pause: () => {
      const { status, pausedAt } = get();
      if (status === "playing" && pausedAt === null) set({ pausedAt: Date.now() });
    },

    resume: () => {
      const { pausedAt, startedAt } = get();
      if (pausedAt !== null) set({ pausedAt: null, startedAt: startedAt + (Date.now() - pausedAt) });
    },

    continueWithExtra: () => {
      const { status, extraAttempt, startedAt, finishedAt } = get();
      if (status !== "lost" || extraAttempt) return;
      // El tiempo en la hoja de resultado y en el anuncio no cuenta. Las casillas marcadas quedan a la vista.
      const now = Date.now();
      set({ status: "playing", extraAttempt: true, check: null, startedAt: startedAt + (now - (finishedAt ?? now)), finishedAt: null, pausedAt: null });
    },
  };
});
