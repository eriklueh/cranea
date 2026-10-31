import type { Bridges, Edge, Island } from "./types";

/** Conexiones posibles: cada isla con la más cercana a la derecha y abajo. */
export function findEdges(islands: readonly Island[]): Edge[] {
  const edges: Edge[] = [];
  for (let a = 0; a < islands.length; a++) {
    const p = islands[a];
    let right = -1;
    let down = -1;
    for (let b = 0; b < islands.length; b++) {
      const q = islands[b];
      if (q.r === p.r && q.c > p.c && (right < 0 || q.c < islands[right].c)) right = b;
      if (q.c === p.c && q.r > p.r && (down < 0 || q.r < islands[down].r)) down = b;
    }
    if (right >= 0) edges.push({ a: Math.min(a, right), b: Math.max(a, right), horizontal: true });
    if (down >= 0) edges.push({ a: Math.min(a, down), b: Math.max(a, down), horizontal: false });
  }
  return edges;
}

/** true si un puente horizontal y uno vertical se cortan. */
export function edgesCross(islands: readonly Island[], e: Edge, f: Edge): boolean {
  if (e.horizontal === f.horizontal) return false;
  const h = e.horizontal ? e : f;
  const v = e.horizontal ? f : e;
  const row = islands[h.a].r;
  const c1 = Math.min(islands[h.a].c, islands[h.b].c);
  const c2 = Math.max(islands[h.a].c, islands[h.b].c);
  const col = islands[v.a].c;
  const r1 = Math.min(islands[v.a].r, islands[v.b].r);
  const r2 = Math.max(islands[v.a].r, islands[v.b].r);
  return col > c1 && col < c2 && row > r1 && row < r2;
}

/** Para cada conexión, las que la cortan. */
export function crossingMap(islands: readonly Island[], edges: readonly Edge[]): number[][] {
  const out = edges.map(() => [] as number[]);
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      if (edgesCross(islands, edges[i], edges[j])) {
        out[i].push(j);
        out[j].push(i);
      }
    }
  }
  return out;
}

/** Para cada isla, sus conexiones posibles. */
export function incidence(islands: readonly Island[], edges: readonly Edge[]): number[][] {
  const out = islands.map(() => [] as number[]);
  edges.forEach((e, i) => {
    out[e.a].push(i);
    out[e.b].push(i);
  });
  return out;
}

/** Puentes que llegan a cada isla. */
export function bridgeCounts(islands: readonly Island[], edges: readonly Edge[], bridges: Bridges): number[] {
  const counts = islands.map(() => 0);
  edges.forEach((e, i) => {
    counts[e.a] += bridges[i] ?? 0;
    counts[e.b] += bridges[i] ?? 0;
  });
  return counts;
}

/** true si los puentes tendidos unen todas las islas en un solo grupo. */
export function isConnected(islands: readonly Island[], edges: readonly Edge[], bridges: Bridges): boolean {
  if (islands.length === 0) return true;
  const adj = islands.map(() => [] as number[]);
  edges.forEach((e, i) => {
    if ((bridges[i] ?? 0) > 0) {
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    }
  });
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) for (const next of adj[stack.pop()!]) if (!seen.has(next)) { seen.add(next); stack.push(next); }
  return seen.size === islands.length;
}

/** Conexiones con puentes que se cortan entre sí. */
export function crossingConflicts(islands: readonly Island[], edges: readonly Edge[], bridges: Bridges): number[] {
  const out = new Set<number>();
  const crossings = crossingMap(islands, edges);
  edges.forEach((_, i) => {
    if (!bridges[i]) return;
    for (const j of crossings[i]) if (bridges[j]) out.add(i).add(j);
  });
  return [...out];
}

/** Un tablero resuelto: cada isla completa, sin cruces, máximo dos puentes y todo conectado. */
export function isSolved(islands: readonly Island[], edges: readonly Edge[], bridges: Bridges): boolean {
  if (bridges.length !== edges.length || bridges.some((b) => b < 0 || b > 2 || !Number.isInteger(b))) return false;
  const counts = bridgeCounts(islands, edges, bridges);
  if (counts.some((n, i) => n !== islands[i].n)) return false;
  if (crossingConflicts(islands, edges, bridges).length) return false;
  return isConnected(islands, edges, bridges);
}
