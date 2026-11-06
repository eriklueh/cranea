import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  WORLDS,
  applyStep,
  emptyBoard,
  generateDaily,
  hintFor,
  hintKey,
  hintResolved,
  lineStep,
  nextStep,
  orderWorld,
  puzzleFromPicture,
  solveLine,
  traceSolve,
  unpack,
  EMPTY as X,
  FILLED as F,
  UNKNOWN as _,
  type Cell,
  type NonogramaPuzzle,
  type PackedLevel,
} from ".";

const levels = (JSON.parse(readFileSync(new URL("../../levels/nonograma.json", import.meta.url), "utf8")) as PackedLevel[]).map(unpack);
const blank = (n: number) => new Array<Cell>(n).fill(_);

describe("lineStep: técnicas en líneas chicas", () => {
  it("empty: la pista 0 va toda con cruz", () => {
    expect(lineStep(blank(4), [])).toMatchObject({ technique: "empty", cellsFilled: [], cellsCrossed: [0, 1, 2, 3] });
  });

  it("exact: 2 1 1 en 6 casillas no deja otra forma", () => {
    expect(lineStep(blank(6), [2, 1, 1])).toMatchObject({ technique: "exact", cellsFilled: [0, 1, 3, 5], cellsCrossed: [2, 4], params: { needed: 6 } });
  });

  it("overlap: un 7 en 10 casillas pinta las 4 del medio", () => {
    const s = lineStep(blank(10), [7])!;
    expect(s.technique).toBe("overlap");
    expect(s.cellsFilled).toEqual([3, 4, 5, 6]);
    expect(s.params.blocks).toEqual([{ block: 0, length: 7, from: 0, to: 9, cells: [3, 4, 5, 6] }]);
  });

  it("overlap con varios tramos: 3 4 en 10", () => {
    const s = lineStep(blank(10), [3, 4])!;
    expect(s.technique).toBe("overlap");
    // El 3 va entre 0 y 4 (cubre 2), el 4 entre 4 y 9 (cubre 6 y 7).
    expect(s.cellsFilled).toEqual([2, 6, 7]);
  });

  it("edge: una pintada contra el borde fija el primer tramo", () => {
    const s = lineStep([F, _, _, _, _, _, _, _], [3, 1])!;
    expect(s.technique).toBe("edge");
    expect(s.cellsFilled).toEqual([1, 2]);
    expect(s.params.anchor).toBe("start");
  });

  it("edge: una cruz achica el lugar del tramo", () => {
    const s = lineStep([_, _, X, _, _, _, _, _], [4])!;
    expect(s.technique).toBe("gap"); // primero, el hueco de 2 donde no entra el 4
    expect(s.cellsCrossed).toEqual([0, 1]);
    const next = lineStep([X, X, X, _, _, _, _, _], [4])!;
    expect(next.technique).toBe("edge");
    expect(next.cellsFilled).toEqual([4, 5, 6]);
  });

  it("gap: un hueco más chico que el tramo más chico", () => {
    expect(lineStep([_, _, X, _, _, _, _, _, _, _], [3, 3])).toMatchObject({
      technique: "gap",
      cellsCrossed: [0, 1],
      params: { gap: { from: 0, size: 2, before: "edge", after: "cross", smallest: 3 } },
    });
  });

  it("fill-rest: quedan justo las libres que faltan", () => {
    expect(lineStep([F, X, _, X, _, X], [1, 1, 1])).toMatchObject({ technique: "fill-rest", cellsFilled: [2, 4], params: { missing: 2 } });
  });

  it("complete: la línea ya tiene lo que pide", () => {
    expect(lineStep([_, F, F, _, _, F, _], [2, 1])).toMatchObject({ technique: "complete", cellsCrossed: [0, 3, 4, 6] });
  });

  it("unreachable: ningún tramo llega a las puntas", () => {
    const s = lineStep([_, _, _, F, _, _, _, _], [2])!;
    expect(s.technique).toBe("unreachable");
    expect(s.cellsCrossed).toEqual([0, 1, 5, 6, 7]);
  });

  it("combined: hace falta probar las formas", () => {
    // 1 1 en _ F _ _ _ con una cruz al final: el segundo 1 tiene que ir en 3.
    const line: Cell[] = [_, _, F, _, _, X, _, _];
    const s = lineStep(line, [1, 3])!;
    expect(s).not.toBeNull();
    const solved = solveLine(line, [1, 3])!;
    for (const p of s.cellsFilled) expect(solved[p]).toBe(F);
    for (const p of s.cellsCrossed) expect(solved[p]).toBe(X);
  });

  it("nada seguro en una línea abierta, y null si no cierra", () => {
    expect(lineStep(blank(10), [1, 1])).toBeNull();
    expect(lineStep([F, F, F], [1, 1])).toBeNull();
  });

  it("cada técnica es una deducción válida (contra el solver de líneas)", () => {
    // Todas las líneas de largo 7 con pista de hasta 3 tramos y marcas parciales al azar (determinístico).
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let t = 0; t < 3000; t++) {
      const sol = Array.from({ length: 7 }, () => rnd() < 0.55);
      const clue: number[] = [];
      let run = 0;
      for (const f of [...sol, false]) if (f) run++; else if (run) { clue.push(run); run = 0; }
      const line = sol.map((f): Cell => (rnd() < 0.35 ? (f ? F : X) : _));
      const s = lineStep(line, clue);
      if (!s) continue;
      for (const p of s.cellsFilled) expect(sol[p]).toBe(true);
      for (const p of s.cellsCrossed) expect(sol[p]).toBe(false);
    }
  });
});

describe("traceSolve", () => {
  it("resuelve todos los niveles publicados desde el tablero vacío, con la solución correcta", () => {
    expect(levels.length).toBeGreaterThan(0);
    for (const p of levels) {
      const t = traceSolve(p.rows, p.cols);
      expect(t.solved, p.id).toBe(true);
      expect(t.grid.map((c) => c === F), p.id).toEqual([...p.solution]);
      for (const s of t.steps) expect(s.cellsFilled.length + s.cellsCrossed.length).toBeGreaterThan(0);
    }
  });

  it("resuelve los mundos y algunos diarios", () => {
    for (const w of WORLDS) for (const p of orderWorld(w).slice(0, 3)) expect(traceSolve(p.rows, p.cols).solved).toBe(true);
    for (const d of ["2026-11-01", "2026-11-06"]) {
      const p = generateDaily(d);
      expect(traceSolve(p.rows, p.cols).solved).toBe(true);
    }
  });

  it("usa varias técnicas en los niveles grandes", () => {
    const used = new Set(levels.flatMap((p) => traceSolve(p.rows, p.cols).steps.map((s) => s.technique)));
    for (const t of ["empty", "exact", "overlap", "edge", "complete", "unreachable"]) expect(used.has(t as never), t).toBe(true);
  });

  it("sigue desde un tablero a medio hacer", () => {
    const p = levels.find((l) => l.width === 10)!;
    const t = traceSolve(p.rows, p.cols);
    const half = t.steps.slice(0, Math.floor(t.steps.length / 2)).reduce((g, s) => applyStep(g, s, p.width), emptyBoard(p));
    const rest = traceSolve(p.rows, p.cols, half);
    expect(rest.solved).toBe(true);
    expect(rest.grid).toEqual(t.grid);
  });
});

describe("hintFor", () => {
  const p: NonogramaPuzzle = puzzleFromPicture("t", "T", ["#####", "#...#", "#.#.#", "#...#", "#####"]);

  it("desde el tablero vacío señala una línea con algo seguro", () => {
    const h = hintFor(p, emptyBoard(p));
    expect(h.kind).toBe("step");
    if (h.kind !== "step") return;
    expect(h.step).toMatchObject({ line: "row", index: 0, technique: "exact" });
    expect(hintKey(h)).toBe(0);
    expect(hintResolved(h, p, emptyBoard(p))).toBe(false);
    expect(hintResolved(h, p, applyStep(emptyBoard(p), h.step, p.width))).toBe(true);
    // Pintar lo que pide alcanza (las cruces son opcionales).
    const painted = emptyBoard(p);
    for (const c of h.step.cellsFilled) painted[c] = F;
    expect(hintResolved(h, p, painted)).toBe(true);
  });

  it("con un error, señala la fila sin decir la casilla", () => {
    const board = emptyBoard(p);
    board[2 * 5 + 1] = F; // fila 3, columna 2: no va
    const h = hintFor(p, board);
    expect(h).toEqual({ kind: "mistake", line: "row", index: 2 });
    expect(hintKey(h)).toBeLessThan(-1);
    board[2 * 5 + 1] = _;
    expect(hintResolved(h, p, board)).toBe(true);
  });

  it("toma lo marcado como dado y no repite lo que ya está", () => {
    const board = applyStep(emptyBoard(p), nextStep(p.rows, p.cols, emptyBoard(p))!, p.width);
    const h = hintFor(p, board);
    expect(h.kind === "step" && !(h.step.line === "row" && h.step.index === 0)).toBe(true);
  });

  it("con el dibujo completo no queda nada", () => {
    const board = p.solution.map((f): Cell => (f ? F : X));
    expect(hintFor(p, board)).toEqual({ kind: "done" });
    expect(hintKey({ kind: "done" })).toBe(-1);
  });

  it("filas y columnas tienen claves distintas", () => {
    const col = { kind: "step" as const, step: { line: "col" as const, index: 0, technique: "exact" as const, cellsFilled: [], cellsCrossed: [], params: { clue: [5], length: 5 } } };
    expect(hintKey(col)).toBe(1000);
  });
});
