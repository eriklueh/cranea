/** Una fila del dibujo: "#" pintada, "." vacía. */
export type PictureRows = readonly string[];

/** Pistas: largo de cada tramo pintado, en orden. Una línea vacía tiene []. */
export type LineClue = readonly number[];

/** Estado de una casilla: 0 sin tocar, 1 pintada, 2 cruz (vacía). */
export type Cell = 0 | 1 | 2;
export const UNKNOWN = 0;
export const FILLED = 1;
export const EMPTY = 2;

export interface NonogramaPuzzle {
  id: string;
  title: string;
  width: number;
  height: number;
  /** solution[r * width + c] === true si la casilla va pintada. */
  solution: readonly boolean[];
  rows: LineClue[];
  cols: LineClue[];
  difficulty: number;
}
