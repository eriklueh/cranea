import type { LineClue } from "./types";

/** Todas las formas de ubicar una pista en una línea de largo n (como máscaras de booleanos). */
export function linePlacements(clue: LineClue, n: number): boolean[][] {
  const out: boolean[][] = [];
  const line = new Array<boolean>(n).fill(false);
  const place = (j: number, from: number) => {
    if (j === clue.length) { out.push(line.slice()); return; }
    const rest = clue.slice(j + 1).reduce((s, x) => s + x + 1, 0);
    for (let start = from; start + clue[j] + rest <= n; start++) {
      for (let x = start; x < start + clue[j]; x++) line[x] = true;
      place(j + 1, start + clue[j] + 1);
      for (let x = start; x < start + clue[j]; x++) line[x] = false;
    }
  };
  place(0, 0);
  return out;
}

/**
 * Cuenta soluciones (hasta `limit`) probando filas enteras y podando por columnas.
 * Es independiente del solver de líneas: sirve para auditar la unicidad.
 */
export function countSolutions(rows: readonly LineClue[], cols: readonly LineClue[], limit = 2): number {
  const height = rows.length;
  const width = cols.length;
  const options = rows.map((clue) => linePlacements(clue, width));
  // Por columna: tramo actual, cantidad de tramos cerrados y si el último cerrado coincide.
  const runIndex = new Array<number>(width).fill(0);
  const runLen = new Array<number>(width).fill(0);
  const colTotal = cols.map((c) => c.reduce((s, x) => s + x, 0));
  const painted = new Array<number>(width).fill(0);
  let found = 0;

  const stepOk = (c: number, filled: boolean, r: number): boolean => {
    const clue = cols[c];
    if (filled) {
      if (runIndex[c] >= clue.length || runLen[c] + 1 > clue[runIndex[c]]) return false;
    } else if (runLen[c] > 0 && runLen[c] !== clue[runIndex[c]]) return false;
    // ¿Alcanzan las filas que quedan para lo que falta pintar?
    const remainingRows = height - r - 1;
    const left = colTotal[c] - painted[c] - (filled ? 1 : 0);
    return left <= remainingRows;
  };

  const visit = (r: number) => {
    if (found >= limit) return;
    if (r === height) {
      for (let c = 0; c < width; c++) {
        const done = runIndex[c] + (runLen[c] > 0 ? 1 : 0);
        if (done !== cols[c].length || (runLen[c] > 0 && runLen[c] !== cols[c][runIndex[c]])) return;
      }
      found++;
      return;
    }
    for (const opt of options[r]) {
      let valid = true;
      for (let c = 0; c < width && valid; c++) valid = stepOk(c, opt[c], r);
      if (!valid) continue;
      const saved = opt.map((_, c) => [runIndex[c], runLen[c], painted[c]] as const);
      for (let c = 0; c < width; c++) {
        if (opt[c]) { runLen[c]++; painted[c]++; }
        else if (runLen[c] > 0) { runIndex[c]++; runLen[c] = 0; }
      }
      visit(r + 1);
      for (let c = 0; c < width; c++) [runIndex[c], runLen[c], painted[c]] = saved[c];
      if (found >= limit) return;
    }
  };
  visit(0);
  return found;
}
