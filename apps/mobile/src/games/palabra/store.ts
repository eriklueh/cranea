/** Copia de apps/web/src/games/palabra/store.ts: partida en curso de Palabra (motor en @cranea/core). */
import { create } from "zustand";
import { hardModeError, isSolved, scoreWord, WORD_LENGTH, type Clue, type PalabraPuzzle } from "@cranea/core/palabra";

interface PalabraSession {
  puzzle: PalabraPuzzle | null;
  input: string[];
  misses: Clue[];
  status: "playing" | "won" | "lost";
  startedAt: number;
  finishedAt: number | null;
  /** Cambia con cada palabra rechazada, para repetir la sacudida. */
  shakeKey: number;
  message: string | null;
  start: (p: PalabraPuzzle) => void;
  press: (letter: string) => void;
  backspace: () => void;
  /** `allowed` es null mientras el diccionario carga: en ese caso solo se acepta la respuesta. */
  submit: (allowed: ReadonlySet<string> | null) => void;
}

export const usePalabra = create<PalabraSession>((set, get) => ({
  puzzle: null,
  input: [],
  misses: [],
  status: "playing",
  startedAt: 0,
  finishedAt: null,
  shakeKey: 0,
  message: null,

  start: (puzzle) => set({ puzzle, input: [], misses: [], status: "playing", startedAt: Date.now(), finishedAt: null, shakeKey: 0, message: null }),

  press: (letter) => {
    const { puzzle, input, status } = get();
    if (!puzzle || status !== "playing" || input.length >= WORD_LENGTH) return;
    set({ input: [...input, letter], message: null });
  },

  backspace: () => {
    const { input, status } = get();
    if (status === "playing") set({ input: input.slice(0, -1), message: null });
  },

  submit: (allowed) => {
    const { puzzle, input, misses, status, shakeKey } = get();
    if (!puzzle || status !== "playing") return;
    if (input.length !== WORD_LENGTH) {
      set({ shakeKey: shakeKey + 1, message: "Faltan letras." });
      return;
    }
    const word = input.join("");
    if (word === puzzle.answer) {
      set({ status: "won", finishedAt: Date.now(), message: null });
      return;
    }
    // Una palabra que no está en la lista, o que no respeta el modo difícil, no gasta intento.
    if (!allowed?.has(word)) {
      set({ shakeKey: shakeKey + 1, message: allowed ? "No está en la lista. No gastaste intento." : "Cargando palabras…" });
      return;
    }
    const rule = puzzle.hard ? hardModeError(word, misses) : null;
    if (rule) {
      set({ shakeKey: shakeKey + 1, message: `${rule} No gastaste intento.` });
      return;
    }
    const scores = scoreWord(puzzle.answer, word);
    const next = [...misses, { word, scores }];
    const lost = next.length >= puzzle.attempts && !isSolved(scores);
    const left = puzzle.attempts - next.length;
    set({
      misses: next,
      input: [],
      status: lost ? "lost" : "playing",
      finishedAt: lost ? Date.now() : null,
      message: lost ? null : left === 1 ? "Te queda un intento." : null,
    });
  },
}));
