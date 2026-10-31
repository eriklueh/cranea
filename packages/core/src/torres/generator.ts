import { rngFrom, shuffle, type Rng } from "../rng";
import { cluesFor, SIDES } from "./board";
import { difficultyOf, solve } from "./solver";
import type { Side, TorresClues, TorresConfig, TorresPuzzle } from "./types";

/** Cuadrado latino al azar: se llena casilla por casilla con retroceso, en orden aleatorio. */
export function randomLatin(rng: Rng, size: number): number[] {
  const grid = new Array<number>(size * size).fill(0);
  const fill = (i: number): boolean => {
    if (i === grid.length) return true;
    const r = Math.floor(i / size);
    const c = i % size;
    for (const v of shuffle(rng, Array.from({ length: size }, (_, k) => k + 1))) {
      let ok = true;
      for (let k = 0; k < size && ok; k++) ok = grid[r * size + k] !== v && grid[k * size + c] !== v;
      if (!ok) continue;
      grid[i] = v;
      if (fill(i + 1)) return true;
      grid[i] = 0;
    }
    return false;
  };
  fill(0);
  return grid;
}

/** Reglas de identidad: pocas casillas dadas y al menos N pistas de borde, para que el juego sea leer los bordes. */
export const maxGivens = (size: number) => Math.floor((size * size) / 8);
export const minClues = (size: number) => size;
export const countClues = (clues: TorresClues) => SIDES.reduce((n, side) => n + clues[side].filter(Boolean).length, 0);

type Item = { kind: "clue"; side: Side; index: number } | { kind: "given"; cell: number };

function tryBuild(rng: Rng, cfg: TorresConfig): Omit<TorresPuzzle, "id"> | null {
  const { size } = cfg;
  const solution = randomLatin(rng, size);
  const clues: TorresClues = cluesFor(solution, size);
  const givens = new Array<number>(size * size).fill(0);
  const board = { size, clues, givens };

  // Con todas las pistas puede faltar información: se agregan casillas dadas donde el solver se traba.
  for (let guard = 0; guard < size * size; guard++) {
    const res = solve(board, cfg.maxTier);
    if (res.solved) break;
    const open = res.masks.flatMap((m, i) => (m & (m - 1) ? [i] : []));
    if (!open.length) return null;
    const cell = open[Math.floor(rng() * open.length)];
    givens[cell] = solution[cell];
  }

  // Quita todo lo que sobre: primero las casillas dadas, después las pistas.
  const items: Item[] = [
    ...shuffle(rng, givens.flatMap((g, cell): Item[] => (g ? [{ kind: "given", cell }] : []))),
    ...shuffle(rng, SIDES.flatMap((side) => clues[side].map((_, index): Item => ({ kind: "clue", side, index })))),
  ];
  for (const item of items) {
    if (item.kind === "clue" && countClues(clues) <= minClues(size)) continue;
    const restore = item.kind === "given" ? givens[item.cell] : clues[item.side][item.index];
    if (item.kind === "given") givens[item.cell] = 0;
    else clues[item.side][item.index] = 0;
    if (!solve(board, cfg.maxTier).solved) {
      if (item.kind === "given") givens[item.cell] = restore;
      else clues[item.side][item.index] = restore;
    }
  }

  if (givens.filter(Boolean).length > maxGivens(size)) return null;
  const res = solve(board, cfg.maxTier);
  if (!res.solved || res.tier < cfg.minTier) return null;
  return { size, clues, givens, solution, tier: res.tier, steps: res.steps, difficulty: difficultyOf(res) };
}

/** Genera un tablero determinístico a partir de una semilla. */
export function generate(seed: string, cfg: TorresConfig): TorresPuzzle {
  const rng = rngFrom(seed);
  for (let attempt = 0; attempt < 400; attempt++) {
    const p = tryBuild(rng, cfg);
    if (p) return { id: seed, ...p };
  }
  const relaxed = { ...cfg, minTier: 1 as const };
  for (let attempt = 0; attempt < 400; attempt++) {
    const p = tryBuild(rng, relaxed);
    if (p) return { id: seed, ...p };
  }
  throw new Error(`No se pudo generar un tablero para ${seed}`);
}
