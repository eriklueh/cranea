import { lineDone } from "./board";
import { solveLine } from "./solver";
import { EMPTY, FILLED, UNKNOWN, type Cell, type LineClue, type NonogramaPuzzle } from "./types";

/**
 * Traza "humana" del Nonograma: de a una línea y una técnica, a partir de lo que ya está marcado.
 * La usan las pistas (web y app): qué línea mirar y cómo se deduce, sin pintar nada.
 *
 * Todas las posiciones son 0-based y relativas a la línea: en una fila, de izquierda a derecha;
 * en una columna, de arriba abajo. `stepCells` las pasa a índices del tablero.
 */

export type LineKind = "row" | "col";

/**
 * Técnicas, de la más simple a la más trabajosa (es el orden en que se eligen):
 * - `empty`: la pista es 0, va toda con cruz.
 * - `exact`: los tramos con un espacio entre cada uno ocupan la línea entera.
 * - `fill-rest`: las casillas libres alcanzan justo para lo que falta pintar.
 * - `gap`: un hueco entre cruces (o el borde) es más chico que el tramo más chico.
 * - `overlap`: un tramo, corrido de punta a punta, siempre cubre ciertas casillas (sin mirar lo marcado).
 * - `edge`: lo mismo, pero lo ya marcado (una pintada contra el borde, una cruz) acota dónde va el tramo.
 * - `complete`: la línea ya tiene todo lo que pide; el resto va con cruz.
 * - `unreachable`: ningún tramo llega a esas casillas.
 * - `combined`: probar todas las formas de ubicar los tramos con lo marcado (el solver de líneas entero).
 */
export type Technique = "empty" | "exact" | "fill-rest" | "gap" | "overlap" | "edge" | "complete" | "unreachable" | "combined";
export const TECHNIQUES: readonly Technique[] = ["empty", "exact", "fill-rest", "gap", "overlap", "edge", "complete", "unreachable", "combined"];

/** Lo que cubre un tramo en cualquier lugar donde entre: `from..to` es donde puede ir; `cells`, lo que pinta siempre. */
export interface BlockReach {
  /** Índice del tramo en la pista. */
  block: number;
  length: number;
  /** Primera y última casilla a las que puede llegar. */
  from: number;
  to: number;
  /** Casillas nuevas que pinta siempre. */
  cells: number[];
}

export interface StepParams {
  clue: LineClue;
  length: number;
  /** `exact`: casillas que ocupan los tramos con un espacio entre cada uno. */
  needed?: number;
  /** `fill-rest`: cuántas faltan pintar (= casillas libres). */
  missing?: number;
  /** `gap`: el hueco (desde, largo), qué lo cierra a cada lado y el tramo más chico. */
  gap?: { from: number; size: number; before: "edge" | "cross"; after: "edge" | "cross"; smallest: number };
  /** `overlap` / `edge`: tramos que pintan algo seguro. */
  blocks?: BlockReach[];
  /** `edge`: si una casilla pintada contra el borde fija el primer (o el último) tramo. */
  anchor?: "start" | "end";
}

export interface LineStep {
  line: LineKind;
  index: number;
  technique: Technique;
  /** Posiciones (en la línea) que quedan pintadas. */
  cellsFilled: number[];
  /** Posiciones (en la línea) que quedan con cruz. */
  cellsCrossed: number[];
  params: StepParams;
}

const sum = (c: LineClue) => c.reduce((s, x) => s + x, 0);
const minSpan = (c: LineClue) => (c.length ? sum(c) + c.length - 1 : 0);
const unknowns = (line: readonly Cell[]) => line.flatMap((v, i) => (v === UNKNOWN ? [i] : []));

/**
 * Ubicación más a la izquierda de cada tramo que respeta lo marcado (o null si no entra).
 * El arreglo `ok[i][j]` dice si desde la casilla i entran los tramos j..k-1; con eso, elegir siempre
 * el primer lugar posible da el comienzo mínimo de cada tramo a la vez.
 */
function leftmost(line: readonly Cell[], clue: LineClue): number[] | null {
  const n = line.length;
  const k = clue.length;
  const fits = (i: number, len: number) => {
    if (i + len > n) return false;
    for (let x = i; x < i + len; x++) if (line[x] === EMPTY) return false;
    return i + len === n || line[i + len] !== FILLED;
  };
  const ok: boolean[][] = Array.from({ length: n + 2 }, () => new Array<boolean>(k + 1).fill(false));
  for (let i = n + 1; i >= 0; i--) {
    for (let j = k; j >= 0; j--) {
      if (i >= n) { ok[i][j] = j === k; continue; }
      let can = line[i] !== FILLED && ok[i + 1][j];
      if (!can && j < k && fits(i, clue[j])) can = ok[Math.min(n, i + clue[j] + 1)][j + 1];
      ok[i][j] = can;
    }
  }
  if (!ok[0][0]) return null;
  const starts: number[] = [];
  let i = 0;
  for (let j = 0; j < k; j++) {
    // El tramo j arranca en el primer s >= i donde entra y deja lugar para el resto, sin saltear pintadas.
    let s = i;
    while (!(fits(s, clue[j]) && ok[Math.min(n, s + clue[j] + 1)][j + 1])) {
      if (line[s] === FILLED) return null; // no pasa: `ok` ya lo garantiza
      s++;
    }
    starts.push(s);
    i = s + clue[j] + 1;
  }
  return starts;
}

function rightmost(line: readonly Cell[], clue: LineClue): number[] | null {
  const n = line.length;
  const rev = leftmost([...line].reverse(), [...clue].reverse());
  if (!rev) return null;
  return rev.map((s, j) => n - s - clue[clue.length - 1 - j]).reverse();
}

type Found = Pick<LineStep, "technique" | "cellsFilled" | "cellsCrossed" | "params">;

/** Cada técnica, sola. Devuelve solo casillas nuevas (las que estaban sin tocar). */
function techniques(line: readonly Cell[], clue: LineClue): Found[] {
  const n = line.length;
  const free = unknowns(line);
  if (!free.length) return [];
  const base = { clue, length: n };
  const out: Found[] = [];
  const push = (technique: Technique, filled: number[], crossed: number[], extra: Partial<StepParams> = {}) => {
    const f = filled.filter((i) => line[i] === UNKNOWN);
    const x = crossed.filter((i) => line[i] === UNKNOWN);
    if (f.length || x.length) out.push({ technique, cellsFilled: f, cellsCrossed: x, params: { ...base, ...extra } });
  };

  if (!clue.length) {
    push("empty", [], free);
    return out;
  }

  if (minSpan(clue) === n) {
    const filled: number[] = [];
    const crossed: number[] = [];
    let at = 0;
    clue.forEach((len, j) => {
      for (let x = 0; x < len; x++) filled.push(at + x);
      at += len;
      if (j < clue.length - 1) crossed.push(at++);
    });
    push("exact", filled, crossed, { needed: n });
  }

  const painted = line.filter((v) => v === FILLED).length;
  const missing = sum(clue) - painted;
  if (missing > 0 && missing === free.length) push("fill-rest", free, [], { missing });

  // Huecos sin pintar, entre cruces o el borde, donde no entra ni el tramo más chico.
  const smallest = Math.min(...clue);
  for (let i = 0; i < n; ) {
    if (line[i] === EMPTY) { i++; continue; }
    let j = i;
    while (j < n && line[j] !== EMPTY) j++;
    const size = j - i;
    const seg = Array.from({ length: size }, (_, x) => i + x);
    if (size < smallest && seg.every((x) => line[x] === UNKNOWN)) {
      push("gap", [], seg, { gap: { from: i, size, before: i === 0 ? "edge" : "cross", after: j === n ? "edge" : "cross", smallest } });
      break; // de a un hueco por paso: es más fácil de explicar
    }
    i = j;
  }

  const L = leftmost(line, clue);
  const R = rightmost(line, clue);
  if (L && R) {
    const blank = new Array<Cell>(n).fill(UNKNOWN);
    const freeL = leftmost(blank, clue)!;
    const freeR = rightmost(blank, clue)!;
    const reach = (starts: { l: number[]; r: number[] }, onlyNew: boolean): BlockReach[] =>
      clue.flatMap((len, j) => {
        const cells: number[] = [];
        for (let x = starts.r[j]; x < starts.l[j] + len; x++) if (!onlyNew || line[x] === UNKNOWN) cells.push(x);
        return cells.length ? [{ block: j, length: len, from: starts.l[j], to: starts.r[j] + len - 1, cells }] : [];
      });
    // Superposición sin mirar lo marcado: solo si aporta casillas nuevas.
    const plain = reach({ l: freeL, r: freeR }, true);
    if (plain.length) push("overlap", plain.flatMap((b) => b.cells), [], { blocks: plain });
    const withMarks = reach({ l: L, r: R }, true).filter((b) => b.cells.some((x) => !plain.some((p) => p.cells.includes(x))));
    if (withMarks.length) {
      // El ancla cuenta solo si ese tramo es el que pinta algo en este paso.
      const last = clue.length - 1;
      const anchor =
        line[0] === FILLED && R[0] === 0 && withMarks.some((b) => b.block === 0)
          ? "start"
          : line[n - 1] === FILLED && L[last] + clue[last] === n && withMarks.some((b) => b.block === last)
            ? "end"
            : undefined;
      push("edge", withMarks.flatMap((b) => b.cells), [], { blocks: withMarks, ...(anchor ? { anchor } : {}) });
    }
    // Lo que ningún tramo alcanza: antes del primero, después del último y entre dos seguidos.
    const crossed: number[] = [];
    for (let x = 0; x < n; x++) {
      const covered = clue.some((len, j) => x >= L[j] && x <= R[j] + len - 1);
      if (!covered) crossed.push(x);
    }
    push("unreachable", [], crossed);
  }

  if (lineDone(line, clue)) push("complete", [], free);

  const solved = solveLine(line, clue);
  if (solved) push("combined", free.filter((i) => solved[i] === FILLED), free.filter((i) => solved[i] === EMPTY));
  return out;
}

/** La deducción más simple que aporta algo en una línea, o null si no hay nada seguro (o la línea no cierra). */
export function lineStep(line: readonly Cell[], clue: LineClue): Found | null {
  if (!solveLine(line, clue)) return null;
  const found = techniques(line, clue);
  if (!found.length) return null;
  return found.sort((a, b) => TECHNIQUES.indexOf(a.technique) - TECHNIQUES.indexOf(b.technique))[0];
}

const lineOf = (grid: readonly Cell[], width: number, height: number, kind: LineKind, index: number): Cell[] =>
  kind === "row" ? grid.slice(index * width, (index + 1) * width) : Array.from({ length: height }, (_, r) => grid[r * width + index]);

/** Índice en el tablero de la posición `pos` de una línea. */
export const lineCell = (width: number, kind: LineKind, index: number, pos: number) => (kind === "row" ? index * width + pos : pos * width + index);

/** Casillas del tablero que pinta y cruza un paso. */
export const stepCells = (step: LineStep, width: number) => ({
  filled: step.cellsFilled.map((p) => lineCell(width, step.line, step.index, p)),
  crossed: step.cellsCrossed.map((p) => lineCell(width, step.line, step.index, p)),
});

/**
 * El próximo paso desde `grid` (lo pintado y cruzado se toma como dado): la técnica más simple en
 * cualquier línea; a igualdad, la que más aporta, después filas antes que columnas, de arriba/izquierda.
 */
export function nextStep(rows: readonly LineClue[], cols: readonly LineClue[], grid: readonly Cell[]): LineStep | null {
  const width = cols.length;
  const height = rows.length;
  let best: LineStep | null = null;
  const rank = (s: LineStep) => TECHNIQUES.indexOf(s.technique);
  for (const [kind, clues] of [["row", rows], ["col", cols]] as const) {
    clues.forEach((clue, index) => {
      const found = lineStep(lineOf(grid, width, height, kind, index), clue);
      if (!found) return;
      const step: LineStep = { line: kind, index, ...found };
      const size = (s: LineStep) => s.cellsFilled.length + s.cellsCrossed.length;
      if (!best || rank(step) < rank(best) || (rank(step) === rank(best) && size(step) > size(best))) best = step;
    });
  }
  return best;
}

export function applyStep(grid: readonly Cell[], step: LineStep, width: number): Cell[] {
  const next = grid.slice();
  const { filled, crossed } = stepCells(step, width);
  for (const i of filled) next[i] = FILLED;
  for (const i of crossed) next[i] = EMPTY;
  return next;
}

export interface Trace {
  steps: LineStep[];
  grid: Cell[];
  solved: boolean;
}

/** Aplica pasos de a uno desde `grid` (vacío si no se da) hasta terminar o trabarse. */
export function traceSolve(rows: readonly LineClue[], cols: readonly LineClue[], start?: readonly Cell[]): Trace {
  const width = cols.length;
  let grid: Cell[] = start ? start.slice() : new Array<Cell>(width * rows.length).fill(UNKNOWN);
  const steps: LineStep[] = [];
  for (;;) {
    const step = nextStep(rows, cols, grid);
    if (!step) break;
    steps.push(step);
    grid = applyStep(grid, step, width);
  }
  return { steps, grid, solved: grid.every((v) => v !== UNKNOWN) };
}

/** Lo que dice la pista: un error a revisar, el próximo paso, o que ya está todo. */
export type NonogramaHint =
  | { kind: "mistake"; line: LineKind; index: number }
  | { kind: "step"; step: LineStep }
  | { kind: "done" };

/**
 * Pista para el tablero del jugador. Si algo de lo marcado no va, señala la primera fila (o columna)
 * con un error, sin decir cuál casilla. Si no, el próximo paso desde lo marcado.
 */
export function hintFor(puzzle: NonogramaPuzzle, board: readonly Cell[]): NonogramaHint {
  const { width, height } = puzzle;
  const wrong = (i: number) => (board[i] === FILLED && !puzzle.solution[i]) || (board[i] === EMPTY && puzzle.solution[i]);
  for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) if (wrong(r * width + c)) return { kind: "mistake", line: "row", index: r };
  const step = nextStep(puzzle.rows, puzzle.cols, board);
  return step ? { kind: "step", step } : { kind: "done" };
}

/**
 * Identidad de una pista para el límite gratis: volver a pedir la misma (misma línea, mismo tipo) no gasta.
 * Filas 0..999, columnas 1000.., errores negativos; "ya está todo" es -1 y nunca cuenta.
 */
export function hintKey(h: NonogramaHint): number {
  if (h.kind === "done") return -1;
  const line = h.kind === "mistake" ? h : h.step;
  const code = (line.line === "row" ? 0 : 1000) + line.index;
  return h.kind === "mistake" ? -2 - code : code;
}

/** Si lo que muestra la pista ya está en el tablero (el paso aplicado o el error corregido): se puede cerrar. */
export function hintResolved(h: NonogramaHint, puzzle: NonogramaPuzzle, board: readonly Cell[]): boolean {
  if (h.kind === "done") return false;
  if (h.kind === "mistake") {
    const line = lineOf(board, puzzle.width, puzzle.height, h.line, h.index);
    return line.every((v, p) => {
      const sol = puzzle.solution[lineCell(puzzle.width, h.line, h.index, p)];
      return !((v === FILLED && !sol) || (v === EMPTY && sol));
    });
  }
  // Si el paso pinta algo, alcanza con pintarlo (las cruces son opcionales para ganar); si solo cruza, con cruzarlo.
  const { filled, crossed } = stepCells(h.step, puzzle.width);
  return filled.length ? filled.every((i) => board[i] === FILLED) : crossed.every((i) => board[i] === EMPTY);
}
