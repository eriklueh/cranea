import { generateRandom, puzzleWithDifficulty, type RandomConfig } from "./generator";
import { PICTURES_5, PICTURES_10, PICTURES_15, type Picture } from "./pictures";
import { puzzleFromPicture } from "./clues";
import type { NonogramaPuzzle } from "./types";

export interface World {
  id: number;
  name: string;
  description: string;
  size: number;
  levels: number;
  /** Niveles del mundo anterior que hay que completar para abrirlo. */
  unlockAfter: number;
  pictures: Picture[];
}

export const WORLDS: World[] = [
  { id: 1, name: "Cinco por cinco", description: "Dibujos chicos para agarrarle la mano a las pistas.", size: 5, levels: PICTURES_5.length, unlockAfter: 0, pictures: PICTURES_5 },
  { id: 2, name: "Diez por diez", description: "Cruzá filas y columnas: cada casilla segura destraba otra.", size: 10, levels: PICTURES_10.length, unlockAfter: 8, pictures: PICTURES_10 },
  { id: 3, name: "Quince por quince", description: "Dibujos grandes. Paciencia y una línea por vez.", size: 15, levels: PICTURES_15.length, unlockAfter: 8, pictures: PICTURES_15 },
];

/** El diario es un tablero de 10×10 con manchas al azar, siempre resoluble sin adivinar. */
export const DAILY_CONFIG: RandomConfig = { width: 10, height: 10, density: 0.56, maxTries: 400 };

export const levelId = (world: number, level: number) => `nonograma:w${world}:l${level}`;
export const dailySeed = (dateKey: string) => `nonograma:daily:${dateKey}`;

export const generateDaily = (dateKey: string) => generateRandom(dailySeed(dateKey), "Dibujo del día", DAILY_CONFIG);

/** Ordena los dibujos de un mundo de menor a mayor dificultad (empates: orden del archivo). */
export function orderWorld(world: World): NonogramaPuzzle[] {
  return world.pictures
    .map((p, i) => ({ i, p: puzzleWithDifficulty("", p.title, p.rows) }))
    .sort((a, b) => a.p.difficulty - b.p.difficulty || a.i - b.i)
    .map(({ p }, n) => ({ ...p, id: levelId(world.id, n + 1) }));
}

/** Formato compacto para el JSON pregenerado: el dibujo alcanza, las pistas se recalculan. */
export interface PackedLevel {
  w: number;
  n: number;
  t: string;
  d: number;
  r: string[];
}

export const pack = (w: number, n: number, p: NonogramaPuzzle): PackedLevel => ({
  w,
  n,
  t: p.title,
  d: p.difficulty,
  r: Array.from({ length: p.height }, (_, row) => p.solution.slice(row * p.width, (row + 1) * p.width).map((f) => (f ? "#" : ".")).join("")),
});

export const unpack = (l: PackedLevel): NonogramaPuzzle => puzzleFromPicture(levelId(l.w, l.n), l.t, l.r, l.d);
