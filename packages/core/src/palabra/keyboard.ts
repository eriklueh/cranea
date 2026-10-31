import type { LetterScore } from "./types";

export type KeyState = LetterScore | "unknown";

/**
 * Estado de cada letra para el teclado, a partir de las filas a la vista (pistas e intentos):
 * verde si alguna vez quedó en su lugar, amarilla si apareció, gris si solo salió gris.
 */
export function keyboardStates(rows: readonly { word: string; scores: readonly LetterScore[] }[]): Record<string, KeyState> {
  const out: Record<string, KeyState> = {};
  for (const row of rows) {
    for (let i = 0; i < row.word.length; i++) {
      const letter = row.word[i];
      const prev = out[letter];
      const score = row.scores[i];
      if (prev === undefined || prev === "unknown" || score > prev) out[letter] = score;
    }
  }
  return out;
}
