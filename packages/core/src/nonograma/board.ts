import { lineClue, sameClue } from "./clues";
import { EMPTY, FILLED, UNKNOWN, type Cell, type NonogramaPuzzle } from "./types";

/** Lógica del tablero del jugador, pura para compartirla con Expo. */

export const emptyBoard = (p: Pick<NonogramaPuzzle, "width" | "height">): Cell[] => new Array<Cell>(p.width * p.height).fill(UNKNOWN);

export const rowCells = (board: readonly Cell[], width: number, r: number) => board.slice(r * width, (r + 1) * width);
export const colCells = (board: readonly Cell[], width: number, c: number) => {
  const out: Cell[] = [];
  for (let i = c; i < board.length; i += width) out.push(board[i]);
  return out;
};

/** Una línea está completa cuando sus casillas pintadas forman exactamente la pista. */
export const lineDone = (line: readonly Cell[], clue: readonly number[]) => sameClue(lineClue(line.map((c) => c === FILLED)), clue);

/** Gana cuando lo pintado coincide con el dibujo. Las cruces no cuentan. */
export const isSolved = (board: readonly Cell[], p: NonogramaPuzzle) => board.every((cell, i) => (cell === FILLED) === p.solution[i]);

/** Casillas en conflicto con el dibujo: pintadas de más o cruzadas donde va pintura. */
export const mistakes = (board: readonly Cell[], p: NonogramaPuzzle) =>
  board.flatMap((cell, i) => ((cell === FILLED && !p.solution[i]) || (cell === EMPTY && p.solution[i]) ? [i] : []));

export type Tool = "fill" | "cross";

export interface StrokeAction {
  from: Cell;
  to: Cell;
}

/**
 * Trazo: la primera casilla decide qué hace el dedo. Si ya tiene lo que pone la herramienta,
 * el trazo borra; si no, lo pone. Solo cambian las casillas que estaban igual que la primera.
 */
export function strokeAction(board: readonly Cell[], start: number, tool: Tool): StrokeAction {
  const target: Cell = tool === "fill" ? FILLED : EMPTY;
  const from = board[start];
  return { from, to: from === target ? UNKNOWN : target };
}

/** Casillas en línea recta desde la primera, por su fila o su columna (el eje con más recorrido). */
export function strokeCells(width: number, start: number, end: number): number[] {
  const r0 = Math.floor(start / width);
  const c0 = start % width;
  const r1 = Math.floor(end / width);
  const c1 = end % width;
  const out: number[] = [];
  if (Math.abs(c1 - c0) >= Math.abs(r1 - r0)) {
    const step = c1 >= c0 ? 1 : -1;
    for (let c = c0; c !== c1 + step; c += step) out.push(r0 * width + c);
  } else {
    const step = r1 >= r0 ? 1 : -1;
    for (let r = r0; r !== r1 + step; r += step) out.push(r * width + c0);
  }
  return out;
}

export function applyStroke(board: readonly Cell[], cells: readonly number[], action: StrokeAction): Cell[] {
  const next = board.slice();
  for (const i of cells) if (next[i] === action.from) next[i] = action.to;
  return next;
}
