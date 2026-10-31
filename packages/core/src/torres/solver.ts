import { isSolved, lineCells } from "./board";
import type { Tier, TorresClues } from "./types";

/**
 * Solver "humano" con candidatos por casilla (bit v-1 = altura v).
 * Cada técnica es deducción válida: nunca adivina. Si llega a un tablero completo, la solución es única.
 */

export interface TorresBoard {
  size: number;
  clues: TorresClues;
  givens: readonly number[];
}

export interface SolveResult {
  solved: boolean;
  grid: number[] | null;
  /** Candidatos al terminar (o al trabarse): sirve al generador para elegir pistas extra. */
  masks: number[];
  tier: Tier;
  steps: number;
  tier2Uses: number;
  tier3Uses: number;
}

interface Line {
  cells: number[];
  start: number;
  end: number;
}

const bit = (v: number) => 1 << (v - 1);
const valueOf = (mask: number) => 32 - Math.clz32(mask);
const isSingle = (mask: number) => mask !== 0 && (mask & (mask - 1)) === 0;
const popcount = (mask: number) => {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
};

function buildLines(size: number, clues: TorresClues): Line[] {
  const out: Line[] = [];
  for (let i = 0; i < size; i++) out.push({ cells: lineCells(size, "left", i), start: clues.left[i], end: clues.right[i] });
  for (let i = 0; i < size; i++) out.push({ cells: lineCells(size, "top", i), start: clues.top[i], end: clues.bottom[i] });
  return out;
}

type Outcome = "changed" | "same" | "contradiction";

class State {
  readonly lines: Line[];
  readonly peers: number[][];
  constructor(readonly size: number, clues: TorresClues) {
    this.lines = buildLines(size, clues);
    this.peers = Array.from({ length: size * size }, (_, a) => {
      const r = Math.floor(a / size);
      const c = a % size;
      const out: number[] = [];
      for (let k = 0; k < size; k++) {
        if (k !== c) out.push(r * size + k);
        if (k !== r) out.push(k * size + c);
      }
      return out;
    });
  }

  initial(givens: readonly number[]): number[] {
    const full = (1 << this.size) - 1;
    return Array.from({ length: this.size * this.size }, (_, i) => (givens[i] ? bit(givens[i]) : full));
  }

  /** Límites por pista: con pista c, a distancia i del borde no entra nada mayor que N - c + 1 + i. Pista 1: la más alta va pegada al borde. */
  clueBounds(masks: number[]): Outcome {
    const n = this.size;
    let changed = false;
    for (const line of this.lines) {
      for (const [clue, order] of [[line.start, line.cells], [line.end, [...line.cells].reverse()]] as const) {
        if (!clue) continue;
        for (let i = 0; i < n; i++) {
          const max = n - clue + 1 + i;
          let allowed = max >= n ? (1 << n) - 1 : (1 << max) - 1;
          if (clue === 1 && i === 0) allowed = bit(n);
          const next = masks[order[i]] & allowed;
          if (next !== masks[order[i]]) {
            masks[order[i]] = next;
            changed = true;
          }
          if (!next) return "contradiction";
        }
      }
    }
    return changed ? "changed" : "same";
  }

  /** Único desnudo: una casilla resuelta saca su altura de la fila y la columna. */
  nakedSingles(masks: number[]): Outcome {
    let changed = false;
    for (let a = 0; a < masks.length; a++) {
      if (!isSingle(masks[a])) continue;
      for (const p of this.peers[a]) {
        if (masks[p] & masks[a]) {
          masks[p] &= ~masks[a];
          if (!masks[p]) return "contradiction";
          changed = true;
        }
      }
    }
    return changed ? "changed" : "same";
  }

  /** Único oculto: una altura que solo entra en una casilla de su línea. */
  hiddenSingles(masks: number[]): Outcome {
    let changed = false;
    for (const line of this.lines) {
      for (let v = 1; v <= this.size; v++) {
        let at = -1;
        let count = 0;
        for (const c of line.cells) {
          if (masks[c] & bit(v)) {
            at = c;
            count++;
          }
        }
        if (count === 0) return "contradiction";
        if (count === 1 && masks[at] !== bit(v)) {
          masks[at] = bit(v);
          changed = true;
        }
      }
    }
    return changed ? "changed" : "same";
  }

  tier1(masks: number[]): Outcome {
    const naked = this.nakedSingles(masks);
    if (naked !== "same") return naked;
    return this.hiddenSingles(masks);
  }

  /** Alturas posibles en cada lugar de la línea, entre todas las combinaciones que respetan candidatos y pistas. null si no hay ninguna. */
  lineOptions(masks: readonly number[], line: Line): number[] | null {
    const n = this.size;
    const allowed = new Array<number>(n).fill(0);
    const cur = new Array<number>(n).fill(0);
    let found = false;
    const rec = (pos: number, used: number, max: number, seen: number) => {
      if (line.start && (seen > line.start || seen + Math.min(n - max, n - pos) < line.start)) return;
      if (pos === n) {
        if (line.end) {
          let m = 0;
          let s = 0;
          for (let i = n - 1; i >= 0; i--) if (cur[i] > m) { m = cur[i]; s++; }
          if (s !== line.end) return;
        }
        found = true;
        for (let i = 0; i < n; i++) allowed[i] |= bit(cur[i]);
        return;
      }
      let m = masks[line.cells[pos]] & ~used;
      while (m) {
        const b = m & -m;
        m ^= b;
        const v = valueOf(b);
        cur[pos] = v;
        rec(pos + 1, used | b, v > max ? v : max, v > max ? seen + 1 : seen);
      }
    };
    rec(0, 0, 0, 0);
    return found ? allowed : null;
  }

  /** Cruce de una línea: aplica el análisis a la primera línea donde descarte algo. */
  tier2(masks: number[]): Outcome {
    for (const line of this.lines) {
      if (line.cells.every((c) => isSingle(masks[c])) && !line.start && !line.end) continue;
      const allowed = this.lineOptions(masks, line);
      if (!allowed) return "contradiction";
      let changed = false;
      line.cells.forEach((c, i) => {
        if (masks[c] & ~allowed[i]) {
          masks[c] &= allowed[i];
          changed = true;
        }
      });
      if (changed) return "changed";
    }
    return "same";
  }

  /** Técnicas 1 y 2 hasta que no rindan más. */
  propagate(masks: number[]): boolean {
    for (;;) {
      let r = this.tier1(masks);
      if (r === "contradiction") return false;
      if (r === "changed") continue;
      r = this.tier2(masks);
      if (r === "contradiction") return false;
      if (r === "same") return true;
    }
  }

  /** Suposición: probar una altura y descartarla si lleva a una contradicción con las técnicas 1 y 2. */
  tier3(masks: number[]): Outcome {
    const open = masks
      .map((m, i) => ({ i, k: popcount(m) }))
      .filter((x) => x.k > 1)
      .sort((a, b) => a.k - b.k || a.i - b.i);
    for (const { i } of open) {
      for (let m = masks[i]; m; m &= m - 1) {
        const b = m & -m;
        const trial = masks.slice();
        trial[i] = b;
        if (!this.propagate(trial)) {
          masks[i] &= ~b;
          return "changed";
        }
      }
    }
    return "same";
  }
}

const solved = (masks: readonly number[]) => masks.every(isSingle);

/** Resuelve como una persona, sin pasar de `maxTier`. */
export function solve(board: TorresBoard, maxTier: Tier = 3): SolveResult {
  const { size, clues, givens } = board;
  const st = new State(size, clues);
  const masks = st.initial(givens);
  let steps = 0;
  let tier2Uses = 0;
  let tier3Uses = 0;
  let tier: Tier = 1;
  const fail = (): SolveResult => ({ solved: false, grid: null, masks, tier, steps, tier2Uses, tier3Uses });

  const bounds = st.clueBounds(masks);
  if (bounds === "contradiction") return fail();
  if (bounds === "changed") steps++;

  for (;;) {
    if (solved(masks)) {
      const grid = masks.map(valueOf);
      if (!isSolved(grid, size, clues, givens)) return fail();
      return { solved: true, grid, masks, tier, steps, tier2Uses, tier3Uses };
    }
    let r = st.tier1(masks);
    if (r === "contradiction") return fail();
    if (r === "changed") { steps++; continue; }
    if (maxTier >= 2) {
      r = st.tier2(masks);
      if (r === "contradiction") return fail();
      if (r === "changed") { steps++; tier2Uses++; if (tier < 2) tier = 2; continue; }
    }
    if (maxTier >= 3) {
      r = st.tier3(masks);
      if (r === "changed") { steps++; tier3Uses++; tier = 3; continue; }
    }
    return fail();
  }
}

/** Cuenta soluciones (hasta `limit`) con propagación y ramificación. Para validar unicidad. */
export function countSolutions(board: TorresBoard, limit = 2): number {
  const st = new State(board.size, board.clues);
  const root = st.initial(board.givens);
  if (st.clueBounds(root) === "contradiction") return 0;
  let count = 0;
  const rec = (masks: number[]) => {
    if (count >= limit || !st.propagate(masks)) return;
    let best = -1;
    for (let i = 0; i < masks.length; i++) {
      if (!isSingle(masks[i]) && (best < 0 || popcount(masks[i]) < popcount(masks[best]))) best = i;
    }
    if (best < 0) {
      if (isSolved(masks.map(valueOf), board.size, board.clues, board.givens)) count++;
      return;
    }
    for (let m = masks[best]; m && count < limit; m &= m - 1) {
      const trial = masks.slice();
      trial[best] = m & -m;
      rec(trial);
    }
  };
  rec(root);
  return count;
}

export const difficultyOf = (r: Pick<SolveResult, "steps" | "tier2Uses" | "tier3Uses">) => r.steps + 3 * r.tier2Uses + 8 * r.tier3Uses;
