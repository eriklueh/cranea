import { generate } from "./generator";
import type { Tier, TorresConfig, TorresPuzzle } from "./types";

export interface World extends TorresConfig {
  id: number;
  name: string;
  description: string;
  levels: number;
  /** Niveles del mundo anterior que hay que completar para abrirlo. */
  unlockAfter: number;
}

export const WORLDS: World[] = [
  { id: 1, name: "Cuatro por cuatro", description: "Mirá los bordes: una pista de 1 o de 4 ya te dice mucho.", size: 4, minTier: 1, maxTier: 2, levels: 24, unlockAfter: 0 },
  { id: 2, name: "Cinco por cinco", description: "Cruzá cada fila con sus dos pistas y descartá alturas.", size: 5, minTier: 1, maxTier: 2, levels: 24, unlockAfter: 8 },
  { id: 3, name: "Seis por seis", description: "Más torres, y a veces hay que suponer una altura.", size: 6, minTier: 2, maxTier: 3, levels: 24, unlockAfter: 8 },
  { id: 4, name: "Siete por siete", description: "La ciudad grande. Todas las técnicas juntas.", size: 7, minTier: 2, maxTier: 3, levels: 24, unlockAfter: 8 },
];

export const DAILY_CONFIG: TorresConfig = { size: 5, minTier: 2, maxTier: 3 };

export const levelSeed = (world: number, level: number) => `torres:w${world}:l${level}`;
export const dailySeed = (dateKey: string) => `torres:daily:${dateKey}`;

/**
 * Los candidatos de un mundo alternan el techo de técnica dentro de su rango,
 * así la curva tiene tableros fáciles al principio y exigentes al final.
 */
export function candidateConfig(world: World, candidate: number): TorresConfig {
  const span = world.maxTier - world.minTier + 1;
  const maxTier = (world.minTier + (candidate % span)) as Tier;
  return { size: world.size, minTier: maxTier, maxTier };
}

export const generateCandidate = (world: World, candidate: number) => generate(levelSeed(world.id, candidate), candidateConfig(world, candidate));
export const generateDaily = (dateKey: string) => generate(dailySeed(dateKey), DAILY_CONFIG);

/** Formato compacto: s = solución, g = dadas (0 = vacía), c = pistas arriba|abajo|izquierda|derecha (0 = sin pista). */
export interface PackedLevel {
  w: number;
  n: number;
  s: string;
  g: string;
  c: string;
  t: Tier;
  d: number;
}

const digits = (xs: readonly number[]) => xs.join("");
const parse = (s: string) => [...s].map(Number);

export const pack = (w: number, n: number, p: TorresPuzzle): PackedLevel => ({
  w,
  n,
  s: digits(p.solution),
  g: digits(p.givens),
  c: [p.clues.top, p.clues.bottom, p.clues.left, p.clues.right].map(digits).join("|"),
  t: p.tier,
  d: p.difficulty,
});

export function unpack(l: PackedLevel): TorresPuzzle {
  const [top, bottom, left, right] = l.c.split("|").map(parse);
  return {
    id: levelSeed(l.w, l.n),
    size: top.length,
    clues: { top, bottom, left, right },
    givens: parse(l.g),
    solution: parse(l.s),
    tier: l.t,
    steps: 0,
    difficulty: l.d,
  };
}

/** Minimiza la suma de saltos al cuadrado: curva suave, extremos incluidos y sin repetir candidatos. */
export function selectDifficultyCurve(candidates: readonly TorresPuzzle[], count: number): TorresPuzzle[] {
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
  const selected: TorresPuzzle[] = [];
  let end = sorted.length - 1;
  for (let used = count; used >= 1; used--) {
    selected.push(sorted[end]);
    end = previous[used][end];
  }
  return selected.reverse();
}
