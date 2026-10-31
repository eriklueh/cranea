import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  WORLDS,
  applyStroke,
  cluesFor,
  countSolutions,
  emptyBoard,
  generateDaily,
  isSolved,
  lineClue,
  lineDone,
  mistakes,
  orderWorld,
  pack,
  solve,
  solveLine,
  strokeAction,
  strokeCells,
  unpack,
  EMPTY,
  FILLED,
  UNKNOWN,
  type Cell,
  type NonogramaPuzzle,
  type PackedLevel,
} from ".";

const levels = JSON.parse(readFileSync(new URL("../../levels/nonograma.json", import.meta.url), "utf8")) as PackedLevel[];

/** Unicidad (contador independiente) y deducción sin suponer (solver de líneas). */
function expectFair(p: NonogramaPuzzle) {
  const clues = cluesFor(p.solution, p.width, p.height);
  expect(p.rows).toEqual(clues.rows);
  expect(p.cols).toEqual(clues.cols);
  expect(countSolutions(p.rows, p.cols, 2)).toBe(1);
  const solved = solve(p.rows, p.cols);
  expect(solved.solved).toBe(true);
  expect(solved.grid.map((c) => c === FILLED)).toEqual([...p.solution]);
}

describe("solveLine", () => {
  it("marca la superposición de un tramo largo", () => {
    expect(solveLine([0, 0, 0, 0, 0], [4])).toEqual([0, 1, 1, 1, 0]);
  });
  it("una pista vacía cruza toda la línea", () => {
    expect(solveLine([0, 0, 0], [])).toEqual([EMPTY, EMPTY, EMPTY]);
  });
  it("completa con lo ya marcado", () => {
    expect(solveLine([FILLED, 0, 0, 0, 0], [1, 1])).toEqual([FILLED, EMPTY, 0, 0, 0]);
  });
  it("detecta contradicciones", () => {
    expect(solveLine([FILLED, FILLED, FILLED], [1, 1])).toBeNull();
  });
});

describe("countSolutions", () => {
  it("encuentra la ambigüedad clásica de dos diagonales", () => {
    expect(countSolutions([[1], [1]], [[1], [1]])).toBe(2);
  });
});

describe("niveles pregenerados", () => {
  it("coinciden con lo que genera el script (determinístico)", () => {
    const expected = WORLDS.flatMap((w) => orderWorld(w).map((p, i) => pack(w.id, i + 1, p)));
    expect(levels).toEqual(expected);
  });

  it("cada mundo tiene entre 15 y 30 dibujos, del tamaño correcto y con títulos únicos", () => {
    for (const world of WORLDS) {
      const group = levels.filter((l) => l.w === world.id);
      expect(group.length).toBeGreaterThanOrEqual(15);
      expect(group.length).toBeLessThanOrEqual(30);
      expect(group.map((l) => l.n)).toEqual(group.map((_, i) => i + 1));
      expect(new Set(group.map((l) => l.t)).size).toBe(group.length);
      for (const l of group) {
        expect(l.r).toHaveLength(world.size);
        for (const row of l.r) expect(row).toHaveLength(world.size);
      }
    }
  });

  it("la dificultad sube dentro de cada mundo", () => {
    for (const world of WORLDS) {
      const d = levels.filter((l) => l.w === world.id).map((l) => l.d);
      expect(d).toEqual([...d].sort((a, b) => a - b));
    }
  });

  it.each(levels.map((l) => [`${l.w}-${l.n} ${l.t}`, l] as const))("%s: solución única y deducible por líneas", (_, l) => {
    expectFair(unpack(l));
  });
});

describe("diario", () => {
  const dates = Array.from({ length: 60 }, (_, i) => new Date(Date.UTC(2026, 9, 22 + i * 6)).toISOString().slice(0, 10));

  it.each(dates)("%s: único, deducible y sin líneas triviales", (date) => {
    const p = generateDaily(date);
    expect(p.width).toBe(10);
    expect(p.height).toBe(10);
    expectFair(p);
    expect(p.rows.every((c) => c.length > 0)).toBe(true);
    expect(p.cols.every((c) => c.length > 0)).toBe(true);
  });

  it("es el mismo para todos el mismo día y cambia de un día a otro", () => {
    expect(generateDaily("2026-11-01").solution).toEqual(generateDaily("2026-11-01").solution);
    expect(generateDaily("2026-11-01").solution).not.toEqual(generateDaily("2026-11-02").solution);
  });
});

describe("tablero del jugador", () => {
  const p = unpack(levels[0]);

  it("un trazo pinta en línea recta y el siguiente desde una casilla pintada borra", () => {
    const cells = strokeCells(p.width, 0, 3);
    expect(cells).toEqual([0, 1, 2, 3]);
    expect(strokeCells(p.width, 0, 11)).toEqual([0, 5, 10]);
    let board = emptyBoard(p);
    board = applyStroke(board, cells, strokeAction(board, 0, "fill"));
    expect(board.slice(0, 4)).toEqual([FILLED, FILLED, FILLED, FILLED]);
    board = applyStroke(board, [0, 1], strokeAction(board, 0, "fill"));
    expect(board.slice(0, 4)).toEqual([UNKNOWN, UNKNOWN, FILLED, FILLED]);
  });

  it("el trazo solo cambia casillas iguales a la primera", () => {
    const board: Cell[] = emptyBoard(p);
    board[1] = EMPTY;
    const next = applyStroke(board, [0, 1, 2], strokeAction(board, 0, "fill"));
    expect(next.slice(0, 3)).toEqual([FILLED, EMPTY, FILLED]);
  });

  it("gana cuando lo pintado coincide, aunque falten cruces", () => {
    const board = p.solution.map((f): Cell => (f ? FILLED : UNKNOWN));
    expect(isSolved(board, p)).toBe(true);
    expect(mistakes(board, p)).toEqual([]);
    const wrong = board.slice();
    const i = p.solution.findIndex((f) => !f);
    wrong[i] = FILLED;
    expect(isSolved(wrong, p)).toBe(false);
    expect(mistakes(wrong, p)).toEqual([i]);
  });

  it("una línea se completa cuando sus tramos pintados forman la pista", () => {
    expect(lineDone([FILLED, UNKNOWN, FILLED, FILLED], [1, 2])).toBe(true);
    expect(lineDone([FILLED, FILLED, FILLED, UNKNOWN], [1, 2])).toBe(false);
    expect(lineClue([true, false, true, true])).toEqual([1, 2]);
  });
});
