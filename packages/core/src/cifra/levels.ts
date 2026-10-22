import type { CifraConfig, CifraPuzzle, Clue, Tier } from "./types";
import { generate } from "./generator";
import { codeFromString, codeToString } from "./score";

export interface World extends CifraConfig {
  id: number;
  name: string;
  description: string;
  levels: number;
  /** Niveles del mundo anterior que hay que completar para abrirlo. */
  unlockAfter: number;
}

export const WORLDS: World[] = [
  { id: 1, name: "Calentando", description: "Tres cifras y pistas que se leen solas.", length: 3, minRows: 2, maxRows: 5, maxZeroRows: 1, maxDirectEliminations: 6, minTier: 1, maxTier: 1, levels: 30, unlockAfter: 0 },
  { id: 2, name: "Cuatro cifras", description: "Cruzá filas: contá lo que ya sabés y cerrá lo que falta.", length: 4, minRows: 4, maxRows: 6, maxZeroRows: 1, maxDirectEliminations: 5, minTier: 2, maxTier: 2, levels: 30, unlockAfter: 10 },
  { id: 3, name: "Supuestos", description: "Probá una cifra en un lugar y mirá si todo se cae.", length: 4, minRows: 4, maxRows: 6, maxZeroRows: 1, maxDirectEliminations: 5, minTier: 3, maxTier: 3, levels: 30, unlockAfter: 10 },
  { id: 4, name: "Cinco cifras", description: "Códigos largos, todavía sin suposiciones.", length: 5, minRows: 5, maxRows: 7, maxZeroRows: 1, maxDirectEliminations: 4, minTier: 2, maxTier: 2, levels: 30, unlockAfter: 10 },
  { id: 5, name: "Maestría", description: "Cinco cifras y todas las técnicas juntas.", length: 5, minRows: 5, maxRows: 7, maxZeroRows: 1, maxDirectEliminations: 4, minTier: 3, maxTier: 3, levels: 30, unlockAfter: 10 },
];

export const DAILY_CONFIG: CifraConfig = { length: 4, minRows: 4, maxRows: 6, maxZeroRows: 1, maxDirectEliminations: 5, minTier: 2, maxTier: 3 };

export const levelSeed = (world: number, level: number) => `cifra:w${world}:l${level}`;
export const dailySeed = (dateKey: string) => `cifra:daily:${dateKey}`;

/** Formato compacto para guardar niveles pregenerados en JSON. */
export interface PackedLevel {
  w: number;
  n: number;
  s: string;
  t: Tier;
  d: number;
  c: [string, number, number][];
}

export const pack = (w: number, n: number, p: CifraPuzzle): PackedLevel => ({
  w,
  n,
  s: codeToString(p.solution),
  t: p.tier,
  d: p.difficulty,
  c: p.clues.map((c) => [codeToString(c.guess), c.feedback.exact, c.feedback.present]),
});

export const unpack = (l: PackedLevel): CifraPuzzle => ({
  id: levelSeed(l.w, l.n),
  length: l.s.length,
  solution: codeFromString(l.s),
  tier: l.t,
  steps: 0,
  difficulty: l.d,
  clues: l.c.map(([g, exact, present]): Clue => ({ guess: codeFromString(g), feedback: { exact, present } })),
});

export const generateLevel = (world: World, level: number) => generate(levelSeed(world.id, level), world);
export const generateDaily = (dateKey: string) => generate(dailySeed(dateKey), DAILY_CONFIG);

/** Minimiza la suma de saltos al cuadrado: curva suave, extremos incluidos y sin repetir candidatos. */
export function selectDifficultyCurve(candidates: readonly CifraPuzzle[], count: number): CifraPuzzle[] {
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
  const selected: CifraPuzzle[] = [];
  let end = sorted.length - 1;
  for (let used = count; used >= 1; used--) {
    selected.push(sorted[end]);
    end = previous[used][end];
  }
  return selected.reverse();
}
