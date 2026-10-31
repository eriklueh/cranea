import { EMPTY, FILLED, UNKNOWN, type Cell, type LineClue } from "./types";

/**
 * Resuelve una línea sola: devuelve qué casillas quedan forzadas por la pista y lo ya marcado,
 * o null si no hay ninguna forma de ubicar los tramos.
 */
export function solveLine(line: readonly Cell[], clue: LineClue): Cell[] | null {
  const n = line.length;
  const k = clue.length;
  // ok[i][j]: desde la casilla i se pueden ubicar los tramos j..k-1.
  const ok: boolean[][] = Array.from({ length: n + 2 }, () => new Array<boolean>(k + 1).fill(false));
  const fits = (i: number, len: number) => {
    if (i + len > n) return false;
    for (let x = i; x < i + len; x++) if (line[x] === EMPTY) return false;
    return true;
  };
  for (let i = n + 1; i >= 0; i--) {
    for (let j = k; j >= 0; j--) {
      if (i >= n) { ok[i][j] = j === k; continue; }
      let can = line[i] !== FILLED && ok[i + 1][j];
      if (!can && j < k && fits(i, clue[j])) {
        const end = i + clue[j];
        if (end === n) can = ok[n][j + 1];
        else if (line[end] !== FILLED) can = ok[end + 1][j + 1];
      }
      ok[i][j] = can;
    }
  }
  if (!ok[0][0]) return null;
  const canFill = new Array<boolean>(n).fill(false);
  const canEmpty = new Array<boolean>(n).fill(false);
  const seen: boolean[][] = Array.from({ length: n + 2 }, () => new Array<boolean>(k + 1).fill(false));
  const stack: [number, number][] = [[0, 0]];
  seen[0][0] = true;
  const visit = (i: number, j: number) => {
    if (!seen[i][j]) { seen[i][j] = true; stack.push([i, j]); }
  };
  while (stack.length) {
    const [i, j] = stack.pop()!;
    if (i >= n) continue;
    if (line[i] !== FILLED && ok[i + 1][j]) { canEmpty[i] = true; visit(i + 1, j); }
    if (j < k && fits(i, clue[j])) {
      const end = i + clue[j];
      let next = -1;
      if (end === n) { if (ok[n][j + 1]) next = n; }
      else if (line[end] !== FILLED && ok[end + 1][j + 1]) next = end + 1;
      if (next >= 0) {
        for (let x = i; x < end; x++) canFill[x] = true;
        if (end < n) canEmpty[end] = true;
        visit(next, j + 1);
      }
    }
  }
  return line.map((cell, i): Cell => (cell !== UNKNOWN ? cell : canFill[i] && !canEmpty[i] ? FILLED : canEmpty[i] && !canFill[i] ? EMPTY : UNKNOWN));
}

export interface SolveResult {
  solved: boolean;
  /** false si las pistas se contradicen. */
  consistent: boolean;
  grid: Cell[];
  /** Pasadas completas por filas y columnas hasta terminar. */
  sweeps: number;
  /** Líneas que aportaron al menos una casilla nueva. */
  productive: number;
}

/**
 * Solver "humano" de líneas: mira una fila o columna por vez, con lo que ya sabe, y marca lo forzado.
 * Nunca supone. Si llega al final, la solución es única (cada paso es una deducción válida).
 */
export function solve(rows: readonly LineClue[], cols: readonly LineClue[]): SolveResult {
  const height = rows.length;
  const width = cols.length;
  const grid: Cell[] = new Array<Cell>(width * height).fill(UNKNOWN);
  let sweeps = 0;
  let productive = 0;
  let dirtyRows = new Set(Array.from({ length: height }, (_, r) => r));
  let dirtyCols = new Set(Array.from({ length: width }, (_, c) => c));
  while (dirtyRows.size || dirtyCols.size) {
    sweeps++;
    for (const r of [...dirtyRows].sort((a, b) => a - b)) {
      const line = grid.slice(r * width, (r + 1) * width);
      const out = solveLine(line, rows[r]);
      if (!out) return { solved: false, consistent: false, grid, sweeps, productive };
      let changed = false;
      out.forEach((v, c) => { if (v !== line[c]) { grid[r * width + c] = v; dirtyCols.add(c); changed = true; } });
      if (changed) productive++;
    }
    dirtyRows = new Set();
    for (const c of [...dirtyCols].sort((a, b) => a - b)) {
      const line = Array.from({ length: height }, (_, r) => grid[r * width + c]);
      const out = solveLine(line, cols[c]);
      if (!out) return { solved: false, consistent: false, grid, sweeps, productive };
      let changed = false;
      out.forEach((v, r) => { if (v !== line[r]) { grid[r * width + c] = v; dirtyRows.add(r); changed = true; } });
      if (changed) productive++;
    }
    dirtyCols = new Set();
  }
  return { solved: grid.every((v) => v !== UNKNOWN), consistent: true, grid, sweeps, productive };
}

/** Dificultad: cuántas vueltas y cuántas líneas útiles hacen falta, relativo al tamaño. */
export const difficultyOf = (r: SolveResult, width: number, height: number) =>
  Math.round((r.productive * 10) / (width + height)) + r.sweeps * 3;
