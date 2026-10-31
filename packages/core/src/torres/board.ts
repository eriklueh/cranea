import type { Side, TorresClues } from "./types";

export const SIDES: readonly Side[] = ["top", "bottom", "left", "right"];

/** Cuántas torres se ven mirando la línea desde su primer elemento. Los 0 (vacíos) tapan nada y no cuentan. */
export function visibleCount(heights: readonly number[]): number {
  let max = 0;
  let n = 0;
  for (const h of heights) {
    if (h > max) {
      max = h;
      n++;
    }
  }
  return n;
}

/** Índices de las casillas vistas desde un lado, ordenadas desde el borde hacia adentro. */
export function lineCells(size: number, side: Side, index: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < size; k++) {
    const i = side === "bottom" || side === "right" ? size - 1 - k : k;
    out.push(side === "top" || side === "bottom" ? i * size + index : index * size + i);
  }
  return out;
}

/** Todas las pistas de una solución completa. */
export function cluesFor(solution: readonly number[], size: number): TorresClues {
  const clues = { top: [], bottom: [], left: [], right: [] } as TorresClues;
  for (const side of SIDES) {
    for (let i = 0; i < size; i++) clues[side].push(visibleCount(lineCells(size, side, i).map((c) => solution[c])));
  }
  return clues;
}

export type ClueState = "none" | "pending" | "ok" | "conflict";

/**
 * Estado de una pista frente a lo que escribió el jugador:
 * se lee desde el borde hasta el primer vacío. Si ya aparece la torre más alta, el conteo queda cerrado.
 */
export function clueState(values: readonly number[], size: number, side: Side, index: number, clue: number): ClueState {
  if (!clue) return "none";
  let max = 0;
  let seen = 0;
  for (const cell of lineCells(size, side, index)) {
    const h = values[cell];
    if (!h) break;
    if (h > max) {
      max = h;
      seen++;
    }
    if (max === size) return seen === clue ? "ok" : "conflict";
  }
  return seen > clue ? "conflict" : "pending";
}

/** Casillas con una altura repetida en su fila o columna. */
export function duplicateCells(values: readonly number[], size: number): Set<number> {
  const out = new Set<number>();
  for (let a = 0; a < size * size; a++) {
    if (!values[a]) continue;
    const r = Math.floor(a / size);
    const c = a % size;
    for (let k = 0; k < size; k++) {
      const row = r * size + k;
      const col = k * size + c;
      if ((row !== a && values[row] === values[a]) || (col !== a && values[col] === values[a])) {
        out.add(a);
        break;
      }
    }
  }
  return out;
}

/** true si el tablero completo cumple con el cuadrado latino, las pistas y las casillas dadas. */
export function isSolved(values: readonly number[], size: number, clues: TorresClues, givens: readonly number[]): boolean {
  if (values.length !== size * size || values.some((v) => !Number.isInteger(v) || v < 1 || v > size)) return false;
  if (givens.some((g, i) => g !== 0 && g !== values[i])) return false;
  if (duplicateCells(values, size).size) return false;
  return SIDES.every((side) => clues[side].every((clue, i) => clueState(values, size, side, i, clue) !== "conflict"));
}
