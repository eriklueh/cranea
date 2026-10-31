import { randInt, rngFrom } from "../rng";
import { WORD_LENGTH } from "./normalize";
import type { Clue } from "./types";
import type { Dictionary } from "./words";

/** Elige una respuesta con la semilla, salteando las que ya se usaron. Mismo seed => misma palabra. */
export function pickAnswer(seed: string, dict: Dictionary, used: ReadonlySet<string> = new Set()): string {
  const rng = rngFrom(seed);
  for (let i = 0; i < 1000; i++) {
    const word = dict.answers[randInt(rng, dict.answers.length)];
    if (!used.has(word)) return word;
  }
  throw new Error(`No quedan respuestas para ${seed}`);
}

/**
 * Modo difícil: las verdes se quedan en su lugar y cada letra descubierta
 * (verde o amarilla, contando repeticiones) tiene que volver a aparecer.
 * Devuelve qué falta, o null si el intento respeta todo lo descubierto.
 */
export function hardModeError(guess: string, previous: readonly Clue[]): string | null {
  const need = new Map<string, number>();
  for (const clue of previous) {
    const shown = new Map<string, number>();
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = clue.word[i];
      if (clue.scores[i] === 2 && guess[i] !== letter) return `La ${i + 1}.ª letra tiene que ser ${letter.toUpperCase()}.`;
      if (clue.scores[i] > 0) shown.set(letter, (shown.get(letter) ?? 0) + 1);
    }
    for (const [letter, n] of shown) need.set(letter, Math.max(need.get(letter) ?? 0, n));
  }
  for (const [letter, n] of need) {
    const has = [...guess].filter((l) => l === letter).length;
    if (has < n) return n > 1 ? `Tenés que usar ${n} veces la ${letter.toUpperCase()}.` : `Tenés que usar la ${letter.toUpperCase()}.`;
  }
  return null;
}
