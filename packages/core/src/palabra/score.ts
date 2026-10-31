import { WORD_LENGTH } from "./normalize";
import type { Clue, LetterScore } from "./types";

/**
 * Puntaje de Wordle con letras repetidas: primero las verdes; después cada amarilla
 * consume una aparición de esa letra que todavía no se usó. Las de más quedan grises.
 */
export function scoreWord(answer: string, guess: string): LetterScore[] {
  const out: LetterScore[] = new Array(WORD_LENGTH).fill(0);
  const left = new Map<string, number>();
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) out[i] = 2;
    else left.set(answer[i], (left.get(answer[i]) ?? 0) + 1);
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (out[i] === 2) continue;
    const n = left.get(guess[i]) ?? 0;
    if (n > 0) {
      out[i] = 1;
      left.set(guess[i], n - 1);
    }
  }
  return out;
}

export const patternKey = (scores: readonly LetterScore[]) => scores.join("");
export const patternFromKey = (key: string): LetterScore[] => key.split("").map((c) => Number(c) as LetterScore);

export const matches = (word: string, clue: Clue) => patternKey(scoreWord(word, clue.word)) === patternKey(clue.scores);

export const candidates = (words: readonly string[], clues: readonly Clue[]) => words.filter((w) => clues.every((c) => matches(w, c)));

export const isSolved = (scores: readonly LetterScore[]) => scores.every((s) => s === 2);
