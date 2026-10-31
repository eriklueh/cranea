import { normalizeWord } from "./normalize";
import { patternFromKey, patternKey } from "./score";
import { generate } from "./generator";
import type { PalabraConfig, PalabraPuzzle } from "./types";
import type { Dictionary } from "./words";

export interface PalabraWorld extends PalabraConfig {
  id: number;
  name: string;
  description: string;
  levels: number;
  /** Niveles del mundo anterior que hay que completar para abrirlo. */
  unlockAfter: number;
}

const BASE = { maxGreensPerRow: 3, maxGrayRows: 1, maxAlternatives: 0, minYellows: 0, maxYellows: 99 };

export const PALABRA_WORLDS: PalabraWorld[] = [
  { ...BASE, id: 1, name: "Pistas generosas", description: "Muchas letras ya están en su lugar. Ubicá las que faltan.", minRows: 2, maxRows: 3, minGreens: 3, maxGreens: 99, levels: 24, unlockAfter: 0 },
  { ...BASE, id: 2, name: "Menos verdes", description: "Una o dos letras fijas. El resto, cruzando amarillas.", minRows: 2, maxRows: 3, minGreens: 1, maxGreens: 2, levels: 24, unlockAfter: 8 },
  { ...BASE, id: 3, name: "Solo amarillas", description: "Sabés qué letras van, pero ninguna dónde.", minRows: 2, maxRows: 3, minGreens: 0, maxGreens: 0, levels: 24, unlockAfter: 8 },
  { ...BASE, id: 4, name: "Tres filas", description: "Pocas verdes y tres filas para cruzar a la vez.", minRows: 3, maxRows: 3, minGreens: 0, maxGreens: 2, levels: 24, unlockAfter: 8 },
];

export const PALABRA_DAILY_CONFIG: PalabraConfig = { ...BASE, minRows: 2, maxRows: 3, minGreens: 0, maxGreens: 3 };

export const palabraLevelSeed = (world: number, level: number) => `palabra:w${world}:l${level}`;
export const palabraDailySeed = (dateKey: string) => `palabra:daily:${dateKey}`;

/** Formato compacto para los niveles pregenerados. `a` guarda la respuesta con tildes. */
export interface PackedPalabraLevel {
  w: number;
  n: number;
  a: string;
  d: number;
  c: [string, string][];
}

export const packPalabra = (w: number, n: number, p: PalabraPuzzle): PackedPalabraLevel => ({
  w,
  n,
  a: p.display,
  d: p.difficulty,
  c: p.clues.map((c) => [c.word, patternKey(c.scores)]),
});

export const unpackPalabra = (l: PackedPalabraLevel): PalabraPuzzle => ({
  id: palabraLevelSeed(l.w, l.n),
  answer: normalizeWord(l.a),
  display: l.a,
  difficulty: l.d,
  clues: l.c.map(([word, key]) => ({ word, scores: patternFromKey(key) })),
});

/** Minimiza la suma de saltos de dificultad al cuadrado: curva suave, extremos incluidos. */
export function selectPalabraCurve(candidates: readonly PalabraPuzzle[], count: number): PalabraPuzzle[] {
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
  const selected: PalabraPuzzle[] = [];
  let end = sorted.length - 1;
  for (let used = count; used >= 1; used--) {
    selected.push(sorted[end]);
    end = previous[used][end];
  }
  return selected.reverse();
}

export const generatePalabraLevel = (world: PalabraWorld, level: number, dict: Dictionary, attempt = 0) =>
  generate(attempt === 0 ? palabraLevelSeed(world.id, level) : `${palabraLevelSeed(world.id, level)}:${attempt}`, world, dict);

/** El diario se arma en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. */
export const generatePalabraDaily = (dateKey: string, dict: Dictionary) => generate(palabraDailySeed(dateKey), PALABRA_DAILY_CONFIG, dict);
