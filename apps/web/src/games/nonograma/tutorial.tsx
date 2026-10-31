"use client";
import { EMPTY, FILLED, TUTORIAL_PUZZLE as P } from "@cranea/core/nonograma";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { Verdict } from "@/components/tutorial/machine";
import type { TutorialScript } from "@/components/tutorial/types";
import { NonogramaGame } from "./components/nonograma-game";
import { useNonograma } from "./store";

type S = ReturnType<typeof useNonograma.getState>;

// . # # .   2
// # # # #   4
// # . . #   1 1
// # # # #   4
const W = P.width;
const at = (r: number, c: number) => r * W + c;
const rowOf = (r: number) => Array.from({ length: W }, (_, c) => at(r, c));
const cell = (i: number) => `cell-${i}`;
const ROW1 = rowOf(1);
const ROW3 = rowOf(3);
const COL0 = [0, 1, 2, 3].map((r) => at(r, 0));

/**
 * Lo pintado tiene que estar dentro de `allowed` (y nada cruzado salvo `crossed`).
 * Listo cuando están pintadas todas las de `goal`.
 */
function paint(s: S, allowed: readonly number[], goal: readonly number[], crossed: readonly number[] = []): Verdict {
  if (s.stroke) return "ignore";
  const ok = s.board.every((v, i) => (v === FILLED ? allowed.includes(i) : v === EMPTY ? crossed.includes(i) : true));
  if (!ok) return "wrong";
  return goal.every((i) => s.board[i] === FILLED) ? "done" : "progress";
}

const SCRIPT: TutorialScript<S> = {
  game: "nonograma",
  name: "Nonograma",
  levelHref: "/nonograma/nivel/1/1",
  homeHref: "/nonograma",
  store: useNonograma,
  live: (s) => s.puzzle === P,
  key: (s) => JSON.stringify([s.board, s.tool, s.status, s.stroke ? 1 : 0]),
  snapshot: (s) => ({ board: s.board, history: s.history, tool: s.tool, status: s.status, finishedAt: s.finishedAt, flagged: [], lastCheck: null, stroke: null }),
  reset: () => useNonograma.getState().start(P),
  steps: [
    { targets: ["board"], text: "Pintá casillas para descubrir un dibujo. Los números de cada fila y columna te dicen cuáles." },
    { targets: ["col-clue-1"], text: "Cada número es un tramo de casillas pintadas seguidas. 2 y 1 es: dos juntas, un hueco y una." },
    {
      targets: [[...ROW1.map(cell), "row-clue-1"]],
      text: "Este 4 pide cuatro seguidas, y la fila tiene cuatro. Pintala entera: tocá o deslizá el dedo.",
      nudge: "Pintá solo esta fila.",
      check: (s) => paint(s, ROW1, ROW1),
    },
    {
      targets: [[...ROW3.map(cell), "row-clue-3"]],
      text: "La de abajo también pide 4. Pintala.",
      nudge: "Pintá solo la fila de abajo.",
      check: (s) => paint(s, [...ROW1, ...ROW3], [...ROW1, ...ROW3]),
    },
    { targets: [["col-clue-0", ...COL0.map(cell)]], text: "Este 3 pide tres seguidas. Ya hay dos pintadas, con un hueco en el medio." },
    {
      targets: [["col-clue-0", ...COL0.map(cell)]],
      anchor: cell(at(2, 0)),
      text: "Para que queden tres juntas, pintá la del medio.",
      nudge: "Pintá la casilla vacía entre las dos.",
      check: (s) => paint(s, [...ROW1, ...ROW3, at(2, 0)], [at(2, 0)]),
    },
    {
      targets: ["tool-cross"],
      text: "Y la de arriba sobra: ahí no va nada. Elegí la cruz.",
      check: (s) => (paint(s, [...ROW1, ...ROW3, at(2, 0)], []) === "wrong" ? "wrong" : s.tool === "cross" ? "done" : "progress"),
    },
    {
      targets: [cell(at(0, 0))],
      text: "Tocá esa casilla para marcarla con una cruz.",
      nudge: "Marcá con cruz la casilla de arriba.",
      check: (s) => {
        const v = paint(s, [...ROW1, ...ROW3, at(2, 0)], [], [at(0, 0)]);
        return v === "ignore" || v === "wrong" ? v : s.board[at(0, 0)] === EMPTY ? "done" : "progress";
      },
    },
    {
      targets: ["board", "tools"],
      anchor: "board",
      text: "Terminá el dibujo. Cuando una línea cumple su número, se apaga.",
      nudge: "Esa no va. Mirá los números.",
      delay: 1000,
      check: (s) => {
        if (s.stroke) return "ignore";
        if (s.status === "won") return "done";
        return s.board.every((v, i) => (v === FILLED ? P.solution[i] : v === EMPTY ? !P.solution[i] : true)) ? "progress" : "wrong";
      },
    },
  ],
  outro: "Leé los números, pintá lo seguro y cruzá lo que sobra. El nivel 1 es de 5 por 5.",
};

export function NonogramaTutorial() {
  return (
    <>
      <NonogramaGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
