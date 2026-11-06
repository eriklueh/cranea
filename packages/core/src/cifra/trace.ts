import type { Clue, Code, Tier } from "./types";
import { basic, bit, clone, Contradiction, fix, FULL, onlyDigit, popcount, removeDigit, setStatus, solved, type State } from "./state";

/**
 * Traza del solver humano: las mismas técnicas, aplicadas de a una fila y una regla,
 * con cada deducción explicada en palabras. Sirve para pistas y para "¿Cómo se resolvía?".
 */

/** Lo que se sabe después de un paso. Lugares y filas empiezan en cero. */
export interface TraceFacts {
  out: number[];
  in: number[];
  /** [lugar, cifra]: la cifra va en ese lugar. */
  fixed: [number, number][];
  /** [lugar, cifra]: la cifra no va en ese lugar. */
  removed: [number, number][];
}

/**
 * Por qué se deduce algo, sin texto: el texto lo arma `cifraStepText` (`@cranea/core/i18n`) en el
 * idioma activo. `row`, `rows` y `place` empiezan en uno, como se muestran.
 */
export type TraceReason =
  | { kind: "none"; row: number }
  | { kind: "all"; row: number }
  | { kind: "noneInPlace"; row: number }
  | { kind: "foundAll"; row: number; total: number; digits: number[] }
  | { kind: "discardedRest"; row: number; total: number; digits: number[] }
  /** `placed`: [lugar, cifra] ya ubicadas. */
  | { kind: "placedAll"; row: number; exact: number; placed: [number, number][] }
  | { kind: "onlyPlaces"; row: number; exact: number }
  | { kind: "hypothesis"; place: number; digit: number; rows: number[] };

export interface TraceStep {
  /** Índices de las pistas que hay que cruzar. */
  rows: number[];
  tier: Tier;
  /** Por qué ("La fila 2 no tiene ninguna cifra del código"). */
  reason: TraceReason;
  /** Qué se deduce directamente (en una suposición, solo descartar esa cifra en ese lugar). */
  effect: TraceFacts;
  /** Lo que sigue de eso ("Con eso, …"); puede estar vacío. */
  more: TraceFacts;
  /** Todo lo que se sabe después del paso. */
  facts: TraceFacts;
}

export interface Trace {
  solved: boolean;
  solution?: Code;
  steps: TraceStep[];
}

const total = (c: Clue) => c.feedback.exact + c.feedback.present;
/** Cuenta, en una fila, cifras que están (a), que no están (b), en su lugar (k) y fuera de su lugar (m). */
function counts(s: State, { guess }: Clue) {
  let a = 0, b = 0, k = 0, m = 0;
  guess.forEach((d, p) => {
    if (s.status[d] === 1) a++;
    else if (s.status[d] === 0) b++;
    if (s.dom[p] === bit(d)) k++;
    else if (!(s.dom[p] & bit(d))) m++;
  });
  return { a, b, k, m };
}

function check(s: State, c: Clue) {
  const { a, b, k, m } = counts(s, c);
  if (a > total(c) || s.L - b < total(c) || k > c.feedback.exact || s.L - m < c.feedback.exact) throw new Contradiction();
}

interface Rule {
  tier: 1 | 2;
  apply: (s: State, c: Clue) => boolean;
  reason: (s: State, c: Clue, row: number) => TraceReason;
}

const each = (ds: readonly number[], f: (d: number, p: number) => boolean) => ds.reduce((ch, d, p) => f(d, p) || ch, false);
const open = (s: State, d: number, p: number) => s.dom[p] !== bit(d) && Boolean(s.dom[p] & bit(d));

const RULES: Rule[] = [
  {
    tier: 1,
    apply: (s, c) => total(c) === 0 && each(c.guess, (d) => setStatus(s, d, 0)),
    reason: (_s, _c, row) => ({ kind: "none", row }),
  },
  {
    tier: 1,
    apply: (s, c) => total(c) === s.L && each(c.guess, (d) => setStatus(s, d, 1)),
    reason: (_s, _c, row) => ({ kind: "all", row }),
  },
  {
    tier: 1,
    apply: (s, c) => c.feedback.exact === 0 && each(c.guess, (d, p) => removeDigit(s, p, d)),
    reason: (_s, _c, row) => ({ kind: "noneInPlace", row }),
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { a, b } = counts(s, c);
      return a + b < s.L && a === total(c) && each(c.guess, (d) => s.status[d] === -1 && setStatus(s, d, 0));
    },
    reason: (s, c, row) => ({ kind: "foundAll", row, total: total(c), digits: c.guess.filter((d) => s.status[d] === 1) }),
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { a, b } = counts(s, c);
      return a + b < s.L && s.L - b === total(c) && each(c.guess, (d) => s.status[d] === -1 && setStatus(s, d, 1));
    },
    reason: (s, c, row) => ({ kind: "discardedRest", row, total: total(c), digits: c.guess.filter((d) => s.status[d] === 0) }),
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { k, m } = counts(s, c);
      return k + m < s.L && k === c.feedback.exact && each(c.guess, (d, p) => open(s, d, p) && removeDigit(s, p, d));
    },
    reason: (s, c, row) => ({
      kind: "placedAll",
      row,
      exact: c.feedback.exact,
      placed: c.guess.flatMap((d, p): [number, number][] => (s.dom[p] === bit(d) ? [[p + 1, d]] : [])),
    }),
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { k, m } = counts(s, c);
      return k + m < s.L && s.L - m === c.feedback.exact && each(c.guess, (d, p) => open(s, d, p) && fix(s, p, d));
    },
    reason: (_s, c, row) => ({ kind: "onlyPlaces", row, exact: c.feedback.exact }),
  },
];

const settle = (s: State) => {
  while (basic(s));
};

function diff(a: State, b: State): TraceFacts {
  const f: TraceFacts = { out: [], in: [], fixed: [], removed: [] };
  for (let p = 0; p < b.L; p++) if (popcount(b.dom[p]) === 1 && popcount(a.dom[p]) !== 1) f.fixed.push([p, onlyDigit(b.dom[p])]);
  for (let d = 0; d < 10; d++) {
    if (a.status[d] === b.status[d]) continue;
    if (b.status[d] === 0) f.out.push(d);
    else if (!f.fixed.some(([, x]) => x === d)) f.in.push(d);
  }
  for (let p = 0; p < b.L; p++) {
    if (popcount(b.dom[p]) === 1) continue;
    for (let d = 0; d < 10; d++) {
      if (!(a.dom[p] & bit(d)) || b.dom[p] & bit(d) || b.status[d] === 0) continue;
      if (b.dom.some((m, q) => q !== p && m === bit(d))) continue;
      f.removed.push([p, d]);
    }
  }
  return f;
}

const merge = (a: TraceFacts, b: TraceFacts): TraceFacts => ({
  out: [...a.out, ...b.out],
  in: [...a.in, ...b.in],
  fixed: [...a.fixed, ...b.fixed],
  removed: [...a.removed, ...b.removed],
});

/** Aplica la deducción `next` sobre `s`, suma sus consecuencias y la deja anotada. */
function commit(s: State, next: State, rows: number[], tier: Tier, reason: TraceReason, lead?: [number, number]): TraceStep {
  const direct = diff(s, next);
  const after = clone(next);
  settle(after);
  const consequences = diff(next, after);
  consequences.in = consequences.in.filter((d) => !direct.fixed.some(([, x]) => x === d));
  s.status = after.status;
  s.dom = after.dom;
  if (!lead) return { rows, tier, reason, effect: direct, more: consequences, facts: merge(direct, consequences) };
  // En una suposición, lo directo es descartar esa cifra en ese lugar; lo demás es consecuencia.
  const rest: TraceFacts = { ...direct, removed: direct.removed.filter(([p, d]) => p !== lead[0] || d !== lead[1]) };
  const effect: TraceFacts = { out: [], in: [], fixed: [], removed: [lead] };
  return { rows, tier, reason, effect, more: merge(rest, consequences), facts: merge({ ...rest, removed: [...rest.removed, lead] }, consequences) };
}

function rowStep(s: State, clues: readonly Clue[], maxTier: Tier): TraceStep | null {
  for (const tier of [1, 2] as const) {
    if (tier > maxTier) break;
    for (const [i, c] of clues.entries()) {
      for (const rule of RULES) {
        if (rule.tier !== tier) continue;
        const t = clone(s);
        if (rule.apply(t, c)) return commit(s, t, [i], tier, rule.reason(s, c, i + 1));
      }
    }
  }
  return null;
}

/** Filas que llevan a una contradicción desde `t`, o null si no se cae. */
function contradictionRows(t: State, clues: readonly Clue[]): number[] | null {
  const used = new Set<number>();
  let row = -1;
  try {
    settle(t);
    for (;;) {
      if (solved(t)) {
        clues.forEach((c, i) => {
          row = i;
          check(t, c);
        });
        return null;
      }
      let progressed = false;
      search: for (const tier of [1, 2]) {
        for (const [i, c] of clues.entries()) {
          for (const rule of RULES) {
            if (rule.tier !== tier) continue;
            row = i;
            if (rule.apply(t, c)) {
              used.add(i);
              row = -1;
              settle(t);
              progressed = true;
              break search;
            }
          }
        }
      }
      row = -1;
      if (!progressed) return null;
    }
  } catch (e) {
    if (!(e instanceof Contradiction)) throw e;
    if (row >= 0) used.add(row);
    return [...used].sort((x, y) => x - y);
  }
}

function hypothesisStep(s: State, clues: readonly Clue[]): TraceStep | null {
  for (let p = 0; p < s.L; p++) {
    if (popcount(s.dom[p]) < 2) continue;
    for (let d = 0; d < 10; d++) {
      if (!(s.dom[p] & bit(d))) continue;
      const t = clone(s);
      t.dom[p] = bit(d);
      const rows = contradictionRows(t, clues);
      if (!rows) continue;
      const next = clone(s);
      removeDigit(next, p, d);
      return commit(s, next, rows, 3, { kind: "hypothesis", place: p + 1, digit: d, rows: rows.map((r) => r + 1) }, [p, d]);
    }
  }
  return null;
}

/** Resuelve como el solver humano, pero anotando cada deducción. */
export function traceSolve(clues: readonly Clue[], length: number, maxTier: Tier = 3): Trace {
  const s: State = { L: length, status: new Array(10).fill(-1), dom: new Array(length).fill(FULL) };
  const steps: TraceStep[] = [];
  try {
    settle(s);
    while (!solved(s)) {
      const step = rowStep(s, clues, maxTier) ?? (maxTier >= 3 ? hypothesisStep(s, clues) : null);
      if (!step) break;
      steps.push(step);
    }
    if (!solved(s)) return { solved: false, steps };
    for (const c of clues) check(s, c);
  } catch (e) {
    if (e instanceof Contradiction) return { solved: false, steps };
    throw e;
  }
  return { solved: true, solution: s.dom.map(onlyDigit), steps };
}
