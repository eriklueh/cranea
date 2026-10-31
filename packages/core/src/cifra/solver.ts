import type { Clue, Code, Tier } from "./types";
import { basic, bit, clone, Contradiction, fix, FULL, onlyDigit, popcount, removeDigit, setStatus, solved, type State } from "./state";

/**
 * Solver "humano": deduce paso a paso con reglas que una persona puede aplicar.
 * Si no llega a la solución sin adivinar, el tablero se descarta.
 */

/** Nivel 1: filas que se leen solas. */
function rowsTier1(s: State, clues: readonly Clue[]): boolean {
  let ch = false;
  for (const { guess, feedback } of clues) {
    const total = feedback.exact + feedback.present;
    if (total === 0) for (const d of guess) ch = setStatus(s, d, 0) || ch;
    if (total === s.L) for (const d of guess) ch = setStatus(s, d, 1) || ch;
    if (feedback.exact === 0) guess.forEach((d, p) => (ch = removeDigit(s, p, d) || ch));
  }
  return ch;
}

/** Nivel 2: contar lo conocido de cada fila y cerrar lo que falta. */
function rowsTier2(s: State, clues: readonly Clue[]): boolean {
  let ch = false;
  for (const { guess, feedback } of clues) {
    const total = feedback.exact + feedback.present;
    const known = guess.map((d) => s.status[d]);
    const a = known.filter((v) => v === 1).length;
    const b = known.filter((v) => v === 0).length;
    if (a > total || s.L - b < total) throw new Contradiction();
    if (a + b < s.L) {
      if (a === total) guess.forEach((d) => s.status[d] === -1 && (ch = setStatus(s, d, 0) || ch));
      else if (s.L - b === total) guess.forEach((d) => s.status[d] === -1 && (ch = setStatus(s, d, 1) || ch));
    }

    const E = feedback.exact;
    let k = 0;
    let m = 0;
    guess.forEach((d, p) => {
      if (s.dom[p] === bit(d)) k++;
      else if (!(s.dom[p] & bit(d))) m++;
    });
    if (k > E || s.L - m < E) throw new Contradiction();
    if (k + m < s.L) {
      guess.forEach((d, p) => {
        const open = s.dom[p] !== bit(d) && Boolean(s.dom[p] & bit(d));
        if (!open) return;
        if (k === E) ch = removeDigit(s, p, d) || ch;
        else if (s.L - m === E) ch = fix(s, p, d) || ch;
      });
    }
  }
  return ch;
}

/** Nivel 3: suponer un dígito en una posición y ver si todo se cae. */
function hypothesis(s: State, clues: readonly Clue[]): boolean {
  for (let p = 0; p < s.L; p++) {
    if (popcount(s.dom[p]) < 2) continue;
    for (let d = 0; d < 10; d++) {
      if (!(s.dom[p] & bit(d))) continue;
      const t = clone(s);
      try {
        t.dom[p] = bit(d);
        propagate(t, clues, 2, { tier: 1, steps: 0, tier2Uses: 0, tier3Uses: 0 });
      } catch (e) {
        if (!(e instanceof Contradiction)) throw e;
        return removeDigit(s, p, d);
      }
    }
  }
  return false;
}

interface Stats {
  tier: Tier;
  steps: number;
  /** Pasadas productivas sobre el estado real; excluye pruebas hipotéticas y validación. */
  tier2Uses: number;
  tier3Uses: number;
}

function propagate(s: State, clues: readonly Clue[], maxTier: Tier, stats: Stats) {
  for (;;) {
    if (solved(s)) {
      rowsTier2(s, clues); // validación final
      return;
    }
    if (basic(s) || rowsTier1(s, clues)) {
      stats.steps++;
      continue;
    }
    if (maxTier >= 2 && rowsTier2(s, clues)) {
      stats.tier = Math.max(stats.tier, 2) as Tier;
      stats.tier2Uses++;
      stats.steps++;
      continue;
    }
    if (maxTier >= 3 && hypothesis(s, clues)) {
      stats.tier = 3;
      stats.tier3Uses++;
      stats.steps++;
      continue;
    }
    return;
  }
}

export interface SolveResult extends Stats {
  solved: boolean;
  solution?: Code;
  tier: Tier;
  steps: number;
}

export function solve(clues: readonly Clue[], length: number, maxTier: Tier = 3): SolveResult {
  const s: State = { L: length, status: new Array(10).fill(-1), dom: new Array(length).fill(FULL) };
  const stats: Stats = { tier: 1, steps: 0, tier2Uses: 0, tier3Uses: 0 };
  try {
    propagate(s, clues, maxTier, stats);
  } catch (e) {
    if (e instanceof Contradiction) return { solved: false, ...stats };
    throw e;
  }
  if (!solved(s)) return { solved: false, ...stats };
  return { solved: true, solution: s.dom.map(onlyDigit), ...stats };
}
