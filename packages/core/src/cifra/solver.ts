import type { Clue, Code, Tier } from "./types";

/**
 * Solver "humano": deduce paso a paso con reglas que una persona puede aplicar.
 * Si no llega a la solución sin adivinar, el tablero se descarta.
 */

const FULL = (1 << 10) - 1;
const bit = (d: number) => 1 << d;
const popcount = (x: number) => {
  let c = 0;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
};
const onlyDigit = (x: number) => 31 - Math.clz32(x);

class Contradiction extends Error {}

interface State {
  L: number;
  /** 1 = está, 0 = no está, -1 = desconocido */
  status: number[];
  /** Por posición, máscara de dígitos posibles. */
  dom: number[];
}

const clone = (s: State): State => ({ L: s.L, status: s.status.slice(), dom: s.dom.slice() });
const solved = (s: State) => s.dom.every((m) => popcount(m) === 1);

function setStatus(s: State, d: number, v: 0 | 1): boolean {
  if (s.status[d] === v) return false;
  if (s.status[d] !== -1) throw new Contradiction();
  s.status[d] = v;
  return true;
}

function removeDigit(s: State, p: number, d: number): boolean {
  if (!(s.dom[p] & bit(d))) return false;
  s.dom[p] &= ~bit(d);
  if (s.dom[p] === 0) throw new Contradiction();
  return true;
}

function fix(s: State, p: number, d: number): boolean {
  if (s.dom[p] === bit(d)) return false;
  if (!(s.dom[p] & bit(d))) throw new Contradiction();
  s.dom[p] = bit(d);
  return true;
}

/** Consecuencias inmediatas de lo que ya se sabe. */
function basic(s: State): boolean {
  let ch = false;
  for (let d = 0; d < 10; d++) {
    if (s.status[d] === 0) for (let p = 0; p < s.L; p++) ch = removeDigit(s, p, d) || ch;
  }
  for (let p = 0; p < s.L; p++) {
    if (popcount(s.dom[p]) === 1) {
      const d = onlyDigit(s.dom[p]);
      ch = setStatus(s, d, 1) || ch;
      for (let q = 0; q < s.L; q++) if (q !== p) ch = removeDigit(s, q, d) || ch;
    }
  }
  for (let d = 0; d < 10; d++) {
    const spots: number[] = [];
    for (let p = 0; p < s.L; p++) if (s.dom[p] & bit(d)) spots.push(p);
    if (spots.length === 0) ch = setStatus(s, d, 0) || ch;
    else if (spots.length === 1 && s.status[d] === 1) ch = fix(s, spots[0], d) || ch;
  }
  const inC = s.status.filter((v) => v === 1).length;
  const outC = s.status.filter((v) => v === 0).length;
  if (inC > s.L || outC > 10 - s.L) throw new Contradiction();
  if (inC === s.L || outC === 10 - s.L) {
    const v = inC === s.L ? 0 : 1;
    for (let d = 0; d < 10; d++) if (s.status[d] === -1) ch = setStatus(s, d, v) || ch;
  }
  return ch;
}

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
