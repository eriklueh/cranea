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

export interface TraceStep {
  /** Índices de las pistas que hay que cruzar. */
  rows: number[];
  tier: Tier;
  /** Por qué: "La fila 2 no tiene ninguna cifra del código". */
  reason: string;
  /** Qué se deduce, con sus consecuencias inmediatas. */
  effect: string;
  text: string;
  facts: TraceFacts;
}

export interface Trace {
  solved: boolean;
  solution?: Code;
  steps: TraceStep[];
}

const total = (c: Clue) => c.feedback.exact + c.feedback.present;
const and = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`);
const digits = (ds: readonly number[]) => and(ds.map((d) => `el ${d}`));
const cifras = (n: number) => `${n} ${n === 1 ? "cifra" : "cifras"}`;
const rowsText = (rows: number[]) => (rows.length === 1 ? `la fila ${rows[0] + 1}` : `las filas ${and(rows.map((r) => String(r + 1)))}`);

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
  reason: (s: State, c: Clue, n: number) => string;
}

const each = (ds: readonly number[], f: (d: number, p: number) => boolean) => ds.reduce((ch, d, p) => f(d, p) || ch, false);
const open = (s: State, d: number, p: number) => s.dom[p] !== bit(d) && Boolean(s.dom[p] & bit(d));

const RULES: Rule[] = [
  {
    tier: 1,
    apply: (s, c) => total(c) === 0 && each(c.guess, (d) => setStatus(s, d, 0)),
    reason: (_s, _c, n) => `La fila ${n} no tiene ninguna cifra del código`,
  },
  {
    tier: 1,
    apply: (s, c) => total(c) === s.L && each(c.guess, (d) => setStatus(s, d, 1)),
    reason: (_s, _c, n) => `Todas las cifras de la fila ${n} están en el código`,
  },
  {
    tier: 1,
    apply: (s, c) => c.feedback.exact === 0 && each(c.guess, (d, p) => removeDigit(s, p, d)),
    reason: (_s, _c, n) => `Ninguna cifra de la fila ${n} está en su lugar`,
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { a, b } = counts(s, c);
      return a + b < s.L && a === total(c) && each(c.guess, (d) => s.status[d] === -1 && setStatus(s, d, 0));
    },
    reason: (s, c, n) => {
      const t = total(c);
      return `La fila ${n} tiene ${cifras(t)} del código y ya ${t === 1 ? "la" : "las"} encontraste (${digits(c.guess.filter((d) => s.status[d] === 1))})`;
    },
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { a, b } = counts(s, c);
      return a + b < s.L && s.L - b === total(c) && each(c.guess, (d) => s.status[d] === -1 && setStatus(s, d, 1));
    },
    reason: (s, c, n) => `La fila ${n} tiene ${cifras(total(c))} del código y ya descartaste ${digits(c.guess.filter((d) => s.status[d] === 0))}`,
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { k, m } = counts(s, c);
      return k + m < s.L && k === c.feedback.exact && each(c.guess, (d, p) => open(s, d, p) && removeDigit(s, p, d));
    },
    reason: (s, c, n) => {
      const placed = c.guess.flatMap((d, p) => (s.dom[p] === bit(d) ? [`el ${d} en el lugar ${p + 1}`] : []));
      return `La fila ${n} tiene ${cifras(c.feedback.exact)} en su lugar y ya ${placed.length === 1 ? "está ubicada" : "están ubicadas"} (${and(placed)})`;
    },
  },
  {
    tier: 2,
    apply: (s, c) => {
      check(s, c);
      const { k, m } = counts(s, c);
      return k + m < s.L && s.L - m === c.feedback.exact && each(c.guess, (d, p) => open(s, d, p) && fix(s, p, d));
    },
    reason: (_s, c, n) => {
      const e = c.feedback.exact;
      return `La fila ${n} tiene ${cifras(e)} en su lugar y ${e === 1 ? "solo una puede estarlo" : `solo ${e} pueden estarlo`}`;
    },
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

function describe(f: TraceFacts): string {
  const parts = f.fixed.map(([p, d]) => `el ${d} va en el lugar ${p + 1}`);
  if (f.in.length) parts.push(`${digits(f.in)} ${f.in.length === 1 ? "está" : "están"} en el código`);
  if (f.out.length) parts.push(`${digits(f.out)} no ${f.out.length === 1 ? "está" : "están"}`);
  const byDigit = new Map<number, number[]>();
  for (const [p, d] of f.removed) byDigit.set(d, [...(byDigit.get(d) ?? []), p + 1]);
  for (const [d, ps] of byDigit) parts.push(`el ${d} no va en ${ps.length === 1 ? `el lugar ${ps[0]}` : `los lugares ${and(ps.map(String))}`}`);
  return parts.join("; ");
}

const merge = (a: TraceFacts, b: TraceFacts): TraceFacts => ({
  out: [...a.out, ...b.out],
  in: [...a.in, ...b.in],
  fixed: [...a.fixed, ...b.fixed],
  removed: [...a.removed, ...b.removed],
});

/** Aplica la deducción `next` sobre `s`, suma sus consecuencias y la deja anotada. */
function commit(s: State, next: State, rows: number[], tier: Tier, reason: string, lead?: [number, number]): TraceStep {
  const direct = diff(s, next);
  const after = clone(next);
  settle(after);
  const consequences = diff(next, after);
  consequences.in = consequences.in.filter((d) => !direct.fixed.some(([, x]) => x === d));
  s.status = after.status;
  s.dom = after.dom;
  // En una suposición, lo directo es descartar esa cifra en ese lugar; lo demás es consecuencia.
  const effect = lead ? `el ${lead[1]} no va en el lugar ${lead[0] + 1}` : describe(direct);
  if (lead) direct.removed = direct.removed.filter(([p, d]) => p !== lead[0] || d !== lead[1]);
  const more = describe(lead ? merge(direct, consequences) : consequences);
  if (lead) direct.removed.push(lead);
  return {
    rows,
    tier,
    reason,
    effect: more ? `${effect}. Con eso, ${more}` : effect,
    text: `${reason}: ${effect}.${more ? ` Con eso, ${more}.` : ""}`,
    facts: merge(direct, consequences),
  };
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
      const why = rows.length ? `${rowsText(rows)} no ${rows.length === 1 ? "cierra" : "cierran"}` : "no quedan lugares para todas las cifras";
      return commit(s, next, rows, 3, `Si el ${d} fuera en el lugar ${p + 1}, ${why}`, [p, d]);
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
