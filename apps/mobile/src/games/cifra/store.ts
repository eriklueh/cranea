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
  /** Pasos de la traza ya pedidos como pista (cada uno gasta una). */
  hintSteps?: number[];
  /** Pistas ganadas con un anuncio. */
  bonusHints?: number;
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
  hintSteps: number[];
  bonusHints: number;
  /** Se pidió una pista sin que quedaran: se ofrece un anuncio o Plus. */
  outOfHints: boolean;
  /** Diario perdido que sigue con un intento extra (anuncio o Plus). */
  extraAttempt: boolean;
  start: (p: CifraPuzzle, saved?: SavedSession | null) => void;
  pause: () => void;
  resume: () => void;
  press: (d: number) => void;
  backspace: () => void;
  submit: () => void;
  cycleMark: (row: number, position: number) => void;
  clearMarks: () => void;
  showHint: (step: number) => void;
  /** Pide la pista del paso `step`. `limit`: pistas gratis del tablero (null = sin límite, con Plus). */
  askHint: (step: number, limit: number | null) => void;
  /** Una pista más (anuncio visto). */
  grantHint: () => void;
  closeHint: () => void;
  /** Después de perder: un intento más. */
  continueWithExtra: () => void;
}

/** Intentos de la partida: los del juego, más uno si se ganó el intento extra. */
export const attemptLimit = (s: Pick<CifraSession, "extraAttempt">) => MAX_ATTEMPTS + (s.extraAttempt ? 1 : 0);

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
  hintSteps: [],
  bonusHints: 0,
  outOfHints: false,
  extraAttempt: false,

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
      hintSteps: saved?.hintSteps ?? [],
      bonusHints: saved?.bonusHints ?? 0,
      outOfHints: false,
      extraAttempt: false,
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
    const lost = next.length >= attemptLimit(s);
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

  askHint: (step, limit) => {
    const { hintSteps, bonusHints, status } = get();
    if (status !== "playing") return;
    // Volver a ver una pista ya pedida, o el aviso de que ya está todo deducido, no gasta.
    const known = step < 0 || hintSteps.includes(step);
    if (!known && limit !== null && hintSteps.length >= limit + bonusHints) {
      set({ hint: null, outOfHints: true });
      return;
    }
    set({ outOfHints: false, hintSteps: known ? hintSteps : [...hintSteps, step] });
    get().showHint(step);
  },

  grantHint: () => set((s) => ({ bonusHints: s.bonusHints + 1, outOfHints: false })),

  closeHint: () => set({ hint: null, outOfHints: false }),

  continueWithExtra: () => {
    const { status, extraAttempt } = get();
    if (status !== "lost" || extraAttempt) return;
    set({ status: "playing", extraAttempt: true, input: [], startedAt: Date.now(), finishedAt: null, hint: null, outOfHints: false });
  },
}));
