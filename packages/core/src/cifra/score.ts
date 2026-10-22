import type { Clue, Code, Feedback } from "./types";

/** Puntúa un intento contra el secreto (códigos sin dígitos repetidos). */
export function score(secret: Code, guess: Code): Feedback {
  let exact = 0;
  let common = 0;
  for (let i = 0; i < guess.length; i++) {
    if (secret[i] === guess[i]) exact++;
    if (secret.includes(guess[i])) common++;
  }
  return { exact, present: common - exact };
}

export const matches = (code: Code, clue: Clue) => {
  const f = score(code, clue.guess);
  return f.exact === clue.feedback.exact && f.present === clue.feedback.present;
};

const cache = new Map<number, number[][]>();

/** Todos los códigos de `length` dígitos distintos (0-9). */
export function allCodes(length: number): number[][] {
  const hit = cache.get(length);
  if (hit) return hit;
  const out: number[][] = [];
  const cur: number[] = [];
  const used = new Array(10).fill(false);
  const rec = () => {
    if (cur.length === length) {
      out.push(cur.slice());
      return;
    }
    for (let d = 0; d < 10; d++) {
      if (used[d]) continue;
      used[d] = true;
      cur.push(d);
      rec();
      cur.pop();
      used[d] = false;
    }
  };
  rec();
  cache.set(length, out);
  return out;
}

export function candidates(clues: readonly Clue[], length: number): number[][] {
  return allCodes(length).filter((c) => clues.every((clue) => matches(c, clue)));
}

export const codeToString = (c: Code) => c.join("");
export const codeFromString = (s: string): number[] => s.split("").map(Number);
