import type { LineClue, NonogramaPuzzle, PictureRows } from "./types";

/** Tramos pintados de una línea. */
export function lineClue(line: readonly boolean[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const filled of line) {
    if (filled) run++;
    else if (run) { out.push(run); run = 0; }
  }
  if (run) out.push(run);
  return out;
}

export function parsePicture(rows: PictureRows): { width: number; height: number; solution: boolean[] } {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  if (!height || !width || rows.some((r) => r.length !== width || /[^#.]/.test(r))) throw new Error("Dibujo inválido");
  return { width, height, solution: rows.flatMap((r) => [...r].map((ch) => ch === "#")) };
}

export const pictureToRows = (solution: readonly boolean[], width: number): string[] =>
  Array.from({ length: solution.length / width }, (_, r) => solution.slice(r * width, (r + 1) * width).map((f) => (f ? "#" : ".")).join(""));

export function cluesFor(solution: readonly boolean[], width: number, height: number): { rows: LineClue[]; cols: LineClue[] } {
  const rows = Array.from({ length: height }, (_, r) => lineClue(solution.slice(r * width, (r + 1) * width)));
  const cols = Array.from({ length: width }, (_, c) => lineClue(Array.from({ length: height }, (_, r) => solution[r * width + c])));
  return { rows, cols };
}

export function sameClue(a: LineClue, b: LineClue) {
  return a.length === b.length && a.every((n, i) => n === b[i]);
}

export function puzzleFromPicture(id: string, title: string, rows: PictureRows, difficulty = 0): NonogramaPuzzle {
  const { width, height, solution } = parsePicture(rows);
  return { id, title, width, height, solution, ...cluesFor(solution, width, height), difficulty };
}
