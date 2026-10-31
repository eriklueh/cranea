import { create } from "zustand";
import { emptyMarks, nextMark, score, type CifraPuzzle, type Clue, type Marks } from "@cranea/core/cifra";
import { MAX_ATTEMPTS } from "./data";

/**
 * Partida en curso de Cifra. Misma lógica que la web (apps/web/src/games/cifra/store.ts);
 * el motor (puntaje, marcas) viene de @cranea/core.
 */

/** Lo que se guarda en el dispositivo para retomar una partida. */
export interface SavedSession {
  input: number[];
  misses: Clue[];
  marks: Marks;
  elapsed: number;
  hintsUsed: number;
}

/** Paso de la traza que muestra la pista (-1: ya está todo deducido) y cuánto se reveló. */
export interface Hint {
  step: number;
  level: 1 | 2;
}

interface CifraSession {
  puzzle: CifraPuzzle | null;
  input: number[];
  misses: Clue[];
  status: "playing" | "won" | "lost";
  marks: Marks;
  elapsed: number;
  startedAt: number;
  finishedAt: number | null;
  shakeKey: number;
  hint: Hint | null;
  hintsUsed: number;
  start: (p: CifraPuzzle, saved?: SavedSession | null) => void;
  pause: () => void;
  resume: () => void;
  press: (d: number) => void;
  backspace: () => void;
  submit: () => void;
  cycleMark: (row: number, position: number) => void;
  clearMarks: () => void;
  showHint: (step: number) => void;
  closeHint: () => void;
}

/** Tiempo jugado: no cuenta mientras la app estuvo cerrada o en segundo plano. */
export const playedMs = (s: Pick<CifraSession, "elapsed" | "startedAt">, now = Date.now()) =>
  s.elapsed + (s.startedAt ? Math.max(0, now - s.startedAt) : 0);

export const useCifra = create<CifraSession>((set, get) => ({
  puzzle: null,
  input: [],
  misses: [],
  status: "playing",
  marks: emptyMarks(),
  elapsed: 0,
  startedAt: 0,
  finishedAt: null,
  shakeKey: 0,
  hint: null,
  hintsUsed: 0,

  start: (puzzle, saved) =>
    set({
      puzzle,
      input: saved?.input ?? [],
      misses: saved?.misses ?? [],
      status: "playing",
      marks: saved?.marks ?? emptyMarks(),
      elapsed: saved?.elapsed ?? 0,
      startedAt: Date.now(),
      finishedAt: null,
      shakeKey: 0,
      hint: null,
      hintsUsed: saved?.hintsUsed ?? 0,
    }),

  pause: () => {
    const s = get();
    if (s.status === "playing" && s.startedAt) set({ elapsed: playedMs(s), startedAt: 0 });
  },

  resume: () => {
    const s = get();
    if (s.puzzle && s.status === "playing" && !s.startedAt) set({ startedAt: Date.now() });
  },

  press: (d) => {
    const { puzzle, input, status } = get();
    if (!puzzle || status !== "playing" || input.length >= puzzle.length || input.includes(d)) return;
    set({ input: [...input, d] });
  },

  backspace: () => {
    const { input, status } = get();
    if (status === "playing") set({ input: input.slice(0, -1) });
  },

  submit: () => {
    const s = get();
    const { puzzle, input, misses, status, shakeKey } = s;
    if (!puzzle || status !== "playing" || input.length !== puzzle.length) return;
    const now = Date.now();
    const feedback = score(puzzle.solution, input);
    if (feedback.exact === puzzle.length) {
      set({ status: "won", elapsed: playedMs(s, now), startedAt: 0, finishedAt: now, hint: null });
      return;
    }
    const next = [...misses, { guess: input, feedback }];
    const lost = next.length >= MAX_ATTEMPTS;
    set({
      misses: next,
      input: [],
      shakeKey: shakeKey + 1,
      ...(lost ? { status: "lost" as const, elapsed: playedMs(s, now), startedAt: 0, finishedAt: now, hint: null } : {}),
    });
  },

  cycleMark: (row, position) => {
    const { puzzle, status, misses } = get();
    if (!puzzle || status !== "playing" || row < 0 || row >= puzzle.clues.length + misses.length || position < 0 || position >= puzzle.length) return;
    set((s) => ({ marks: nextMark(s.marks, row, position) }));
  },

  clearMarks: () => {
    if (get().status === "playing") set({ marks: emptyMarks() });
  },

  // Primer toque: qué filas cruzar. Segundo: la deducción en palabras. Nunca toca las fichas.
  showHint: (step) => {
    const { hint, hintsUsed, status } = get();
    if (status !== "playing") return;
    if (hint?.step === step) {
      if (hint.level === 1) set({ hint: { step, level: 2 }, hintsUsed: hintsUsed + 1 });
      return;
    }
    set({ hint: { step, level: 1 }, hintsUsed: hintsUsed + 1 });
  },

  closeHint: () => set({ hint: null }),
}));
