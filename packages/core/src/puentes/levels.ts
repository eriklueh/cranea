import { findEdges } from "./board";
import { generate } from "./generator";
import type { Island, PuentesConfig, PuentesPuzzle, Tier } from "./types";

export interface World extends PuentesConfig {
  id: number;
  name: string;
  description: string;
  levels: number;
  /** Niveles del mundo anterior que hay que completar para abrirlo. */
  unlockAfter: number;
}

export const WORLDS: World[] = [
  { id: 1, name: "Orilla", description: "Tableros chicos: contá lo que le falta a cada isla.", width: 5, height: 5, minIslands: 6, maxIslands: 9, doubleRate: 0.35, loopRate: 0.15, minTier: 1, maxTier: 1, levels: 24, unlockAfter: 0 },
  { id: 2, name: "Archipiélago", description: "Más islas: ninguna puede quedar aislada del resto.", width: 7, height: 7, minIslands: 10, maxIslands: 14, doubleRate: 0.35, loopRate: 0.2, minTier: 2, maxTier: 2, levels: 24, unlockAfter: 8 },
  { id: 3, name: "Mar abierto", description: "Probá un puente y mirá si todo se cae.", width: 9, height: 9, minIslands: 16, maxIslands: 22, doubleRate: 0.35, loopRate: 0.25, minTier: 3, maxTier: 3, levels: 24, unlockAfter: 8 },
  { id: 4, name: "Travesía", description: "Mapas grandes y todas las técnicas juntas.", width: 11, height: 11, minIslands: 24, maxIslands: 32, doubleRate: 0.35, loopRate: 0.25, minTier: 3, maxTier: 3, levels: 24, unlockAfter: 8 },
];

export const DAILY_CONFIG: PuentesConfig = { width: 7, height: 7, minIslands: 11, maxIslands: 15, doubleRate: 0.35, loopRate: 0.2, minTier: 2, maxTier: 3 };

export const levelSeed = (world: number, level: number) => `puentes:w${world}:l${level}`;
export const dailySeed = (dateKey: string) => `puentes:daily:${dateKey}`;

/**
 * Formato compacto para JSON: `g` son las filas del tablero ("." vacío, cifra = isla)
 * y `b` los puentes de la solución en el orden de `findEdges`.
 */
export interface PackedLevel {
  w: number;
  n: number;
  t: Tier;
  d: number;
  g: string[];
  b: string;
}

export function islandsFromRows(rows: readonly string[]): Island[] {
  const islands: Island[] = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== ".") islands.push({ r, c, n: Number(ch) });
  }));
  return islands;
}

export function rowsFromIslands(p: Pick<PuentesPuzzle, "width" | "height" | "islands">): string[] {
  const rows = Array.from({ length: p.height }, () => new Array<string>(p.width).fill("."));
  for (const i of p.islands) rows[i.r][i.c] = String(i.n);
  return rows.map((r) => r.join(""));
}

export const pack = (w: number, n: number, p: PuentesPuzzle): PackedLevel => ({
  w,
  n,
  t: p.tier,
  d: p.difficulty,
  g: rowsFromIslands(p),
  b: p.solution.join(""),
});

export function unpack(l: PackedLevel): PuentesPuzzle {
  const islands = islandsFromRows(l.g);
  return {
    id: levelSeed(l.w, l.n),
    width: l.g[0].length,
    height: l.g.length,
    islands,
    edges: findEdges(islands),
    solution: [...l.b].map(Number),
    tier: l.t,
    steps: 0,
    difficulty: l.d,
  };
}

export const generateLevel = (world: World, level: number) => generate(levelSeed(world.id, level), world);
export const generateDaily = (dateKey: string) => generate(dailySeed(dateKey), DAILY_CONFIG);

/** Minimiza la suma de saltos al cuadrado: curva suave, extremos incluidos y sin repetir candidatos. */
export function selectDifficultyCurve(candidates: readonly PuentesPuzzle[], count: number): PuentesPuzzle[] {
  if (count < 2 || candidates.length < count) throw new Error("Se necesitan al menos dos niveles y suficientes candidatos");
  const sorted = [...candidates].sort((a, b) => a.difficulty - b.difficulty);
  const costs = Array.from({ length: count + 1 }, () => new Array<number>(sorted.length).fill(Infinity));
  const previous = Array.from({ length: count + 1 }, () => new Array<number>(sorted.length).fill(-1));
  costs[1][0] = 0;
  for (let used = 2; used <= count; used++) {
    for (let end = used - 1; end < sorted.length; end++) {
      for (let from = used - 2; from < end; from++) {
        const gap = sorted[end].difficulty - sorted[from].difficulty;
        const cost = costs[used - 1][from] + gap * gap;
        if (cost < costs[used][end]) {
          costs[used][end] = cost;
          previous[used][end] = from;
        }
      }
    }
  }
  const selected: PuentesPuzzle[] = [];
  let end = sorted.length - 1;
  for (let used = count; used >= 1; used--) {
    selected.push(sorted[end]);
    end = previous[used][end];
  }
  return selected.reverse();
}
