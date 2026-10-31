import { rngFrom } from "../rng";
import { cluesFor, pictureToRows, puzzleFromPicture } from "./clues";
import { difficultyOf, solve } from "./solver";
import type { NonogramaPuzzle, PictureRows } from "./types";

export interface RandomConfig {
  width: number;
  height: number;
  /** Proporción inicial de casillas pintadas, antes de suavizar. */
  density: number;
  maxTries: number;
}

/** Arma un dibujo con manchas: ruido con semilla y una pasada de suavizado (mayoría de vecinos). */
function blobs(seed: string, { width, height, density }: RandomConfig): boolean[] {
  const rng = rngFrom(seed);
  const noise = Array.from({ length: width * height }, () => rng() < density);
  return noise.map((filled, i) => {
    const r = Math.floor(i / width);
    const c = i % width;
    let around = 0;
    let total = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= height || cc >= width) continue;
        total++;
        if (noise[rr * width + cc]) around++;
      }
    }
    return around * 2 > total || (around * 2 === total && filled);
  });
}

/** Ninguna fila ni columna vacía o llena: así cada línea tiene algo para pensar. */
function interesting(solution: readonly boolean[], width: number, height: number) {
  const { rows, cols } = cluesFor(solution, width, height);
  const ok = (clue: readonly number[], size: number) => clue.length > 0 && !(clue.length === 1 && clue[0] === size);
  return rows.every((c) => ok(c, width)) && cols.every((c) => ok(c, height));
}

/**
 * Prueba semillas derivadas hasta encontrar un dibujo con solución única que se resuelve
 * solo con lógica de líneas. Mismo seed => mismo tablero.
 */
export function generateRandom(seed: string, title: string, config: RandomConfig): NonogramaPuzzle {
  for (let attempt = 0; attempt < config.maxTries; attempt++) {
    const solution = blobs(`${seed}:${attempt}`, config);
    if (!interesting(solution, config.width, config.height)) continue;
    const { rows, cols } = cluesFor(solution, config.width, config.height);
    const result = solve(rows, cols);
    if (!result.solved) continue;
    return puzzleFromPicture(seed, title, pictureToRows(solution, config.width), difficultyOf(result, config.width, config.height));
  }
  throw new Error(`Sin tablero válido para ${seed}`);
}

/** Puzzle a partir de un dibujo, con la dificultad que mide el solver. */
export function puzzleWithDifficulty(id: string, title: string, rows: PictureRows): NonogramaPuzzle {
  const p = puzzleFromPicture(id, title, rows);
  const result = solve(p.rows, p.cols);
  if (!result.solved) throw new Error(`"${title}" no se resuelve solo con lógica de líneas`);
  return { ...p, difficulty: difficultyOf(result, p.width, p.height) };
}
