import { crossingMap, incidence, isSolved } from "./board";
import type { Bridges, Edge, Island, Tier } from "./types";

/** Lo que se sabe de cada conexión: entre `lo` y `hi` puentes. */
interface Bounds {
  lo: number[];
  hi: number[];
}

interface Ctx {
  islands: readonly Island[];
  edges: readonly Edge[];
  inc: number[][];
  cross: number[][];
}

const CONTRADICTION = -1;

/** Conteo: lo que le falta a cada isla contra lo que pueden darle sus vecinas; un puente tendido cierra los que lo cortan. */
function countPass(ctx: Ctx, s: Bounds): number {
  let changed = 0;
  for (let e = 0; e < ctx.edges.length; e++) {
    if (s.lo[e] === 0) continue;
    for (const f of ctx.cross[e]) {
      if (s.lo[f] > 0) return CONTRADICTION;
      if (s.hi[f] > 0) { s.hi[f] = 0; changed++; }
    }
  }
  for (let i = 0; i < ctx.islands.length; i++) {
    const need = ctx.islands[i].n;
    let sumLo = 0;
    let sumHi = 0;
    for (const e of ctx.inc[i]) { sumLo += s.lo[e]; sumHi += s.hi[e]; }
    if (need > sumHi || need < sumLo) return CONTRADICTION;
    for (const e of ctx.inc[i]) {
      const lo = Math.max(s.lo[e], need - (sumHi - s.hi[e]));
      const hi = Math.min(s.hi[e], need - (sumLo - s.lo[e]));
      if (lo > hi) return CONTRADICTION;
      if (lo !== s.lo[e] || hi !== s.hi[e]) {
        sumLo += lo - s.lo[e];
        sumHi += hi - s.hi[e];
        s.lo[e] = lo;
        s.hi[e] = hi;
        changed++;
      }
    }
  }
  return changed;
}

/** Grupos de islas ya unidas por puentes seguros. */
function groups(ctx: Ctx, s: Bounds): number[] {
  const parent = ctx.islands.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  ctx.edges.forEach((e, i) => {
    if (s.lo[i] > 0) parent[find(e.a)] = find(e.b);
  });
  return ctx.islands.map((_, i) => find(i));
}

/** Conexión: no cerrar un grupo aislado y usar la única salida de un grupo. */
function connectPass(ctx: Ctx, s: Bounds): number {
  const total = ctx.islands.length;
  if (total <= 1) return 0;
  const group = groups(ctx, s);
  const members = new Map<number, number[]>();
  group.forEach((g, i) => members.set(g, [...(members.get(g) ?? []), i]));
  const missing = ctx.islands.map((isl, i) => isl.n - ctx.inc[i].reduce((sum, e) => sum + s.lo[e], 0));
  const openIn = new Map<number, number>();
  group.forEach((g, i) => openIn.set(g, (openIn.get(g) ?? 0) + missing[i]));

  // Toda la red posible tiene que poder unir las islas.
  const reach = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const x = stack.pop()!;
    for (const e of ctx.inc[x]) {
      if (s.hi[e] === 0) continue;
      const y = ctx.edges[e].a === x ? ctx.edges[e].b : ctx.edges[e].a;
      if (!reach.has(y)) { reach.add(y); stack.push(y); }
    }
  }
  if (reach.size !== total) return CONTRADICTION;

  let changed = 0;
  // Un grupo que no es todo el tablero y ya no le falta nada quedó aislado.
  for (const [g, list] of members) if (list.length < total && openIn.get(g) === 0) return CONTRADICTION;

  // Única salida.
  for (const [g, list] of members) {
    if (list.length === total) continue;
    const exits = new Set<number>();
    for (const i of list) for (const e of ctx.inc[i]) {
      const { a, b } = ctx.edges[e];
      if (s.hi[e] > 0 && group[a] !== group[b]) exits.add(e);
    }
    if (exits.size === 0) return CONTRADICTION;
    if (exits.size === 1) {
      const [e] = exits;
      if (s.lo[e] === 0) { s.lo[e] = 1; changed++; }
    }
  }
  if (changed) return changed;

  // No cerrar grupos: si poner el máximo en una conexión completa todo el grupo resultante, ese máximo no va.
  for (let e = 0; e < ctx.edges.length; e++) {
    if (s.hi[e] <= s.lo[e]) continue;
    const { a, b } = ctx.edges[e];
    const extra = s.hi[e] - s.lo[e];
    const merged = group[a] === group[b] ? members.get(group[a])! : [...members.get(group[a])!, ...members.get(group[b])!];
    if (merged.length === total) continue;
    const open = (group[a] === group[b] ? openIn.get(group[a])! : openIn.get(group[a])! + openIn.get(group[b])!) - 2 * extra;
    if (missing[a] === extra && missing[b] === extra && open === 0) {
      s.hi[e]--;
      changed++;
    }
  }
  return changed;
}

const decided = (s: Bounds) => s.lo.every((lo, i) => lo === s.hi[i]);
const clone = (s: Bounds): Bounds => ({ lo: s.lo.slice(), hi: s.hi.slice() });

/** Aplica conteo y conexión hasta que no cambie nada. false si hay contradicción. */
function closure(ctx: Ctx, s: Bounds): boolean {
  for (;;) {
    const a = countPass(ctx, s);
    if (a === CONTRADICTION) return false;
    if (a) continue;
    const b = connectPass(ctx, s);
    if (b === CONTRADICTION) return false;
    if (!b) return true;
  }
}

export interface SolveResult {
  solved: boolean;
  bridges: Bridges | null;
  tier: Tier;
  /** Pasadas productivas de cualquier técnica. */
  steps: number;
  tier2Uses: number;
  tier3Uses: number;
}

/**
 * Resuelve como una persona: primero conteo, después conexión y, si hace falta, una suposición
 * que lleva a una contradicción. Nunca adivina: si se traba, el tablero no sirve.
 */
export function solve(islands: readonly Island[], edges: readonly Edge[], maxTier: Tier = 3): SolveResult {
  const ctx: Ctx = { islands, edges, inc: incidence(islands, edges), cross: crossingMap(islands, edges) };
  const s: Bounds = { lo: edges.map(() => 0), hi: edges.map(() => 2) };
  let tier: Tier = 1;
  let steps = 0;
  let tier2Uses = 0;
  let tier3Uses = 0;
  const fail = (): SolveResult => ({ solved: false, bridges: null, tier, steps, tier2Uses, tier3Uses });

  while (!decided(s)) {
    const a = countPass(ctx, s);
    if (a === CONTRADICTION) return fail();
    if (a) { steps++; continue; }
    if (maxTier < 2) break;
    const b = connectPass(ctx, s);
    if (b === CONTRADICTION) return fail();
    if (b) { steps++; tier2Uses++; tier = Math.max(tier, 2) as Tier; continue; }
    if (maxTier < 3) break;
    let found = false;
    for (let e = 0; e < edges.length && !found; e++) {
      if (s.lo[e] === s.hi[e]) continue;
      for (const v of [s.lo[e], s.hi[e]]) {
        const trial = clone(s);
        trial.lo[e] = trial.hi[e] = v;
        if (closure(ctx, trial)) continue;
        if (v === s.lo[e]) s.lo[e]++;
        else s.hi[e]--;
        found = true;
        break;
      }
    }
    if (!found) break;
    steps++;
    tier3Uses++;
    tier = 3;
  }
  if (!decided(s) || !isSolved(islands, edges, s.lo)) return fail();
  return { solved: true, bridges: s.lo, tier, steps, tier2Uses, tier3Uses };
}

/** Cuenta soluciones por búsqueda exhaustiva (con poda de conteo), hasta `limit`. */
export function countSolutions(islands: readonly Island[], edges: readonly Edge[], limit = 2): number {
  const ctx: Ctx = { islands, edges, inc: incidence(islands, edges), cross: crossingMap(islands, edges) };
  let found = 0;
  const visit = (s: Bounds) => {
    for (;;) {
      const r = countPass(ctx, s);
      if (r === CONTRADICTION) return;
      if (!r) break;
    }
    let pick = -1;
    for (let e = 0; e < edges.length; e++) if (s.lo[e] < s.hi[e] && (pick < 0 || s.hi[e] - s.lo[e] < s.hi[pick] - s.lo[pick])) pick = e;
    if (pick < 0) {
      if (isSolved(islands, edges, s.lo)) found++;
      return;
    }
    for (let v = s.lo[pick]; v <= s.hi[pick] && found < limit; v++) {
      const next = clone(s);
      next.lo[pick] = next.hi[pick] = v;
      visit(next);
    }
  };
  visit({ lo: edges.map(() => 0), hi: edges.map(() => 2) });
  return found;
}
