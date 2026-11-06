"use client";
import { useMemo } from "react";
import { EMPTY, FILLED, TUTORIAL_PUZZLE as P } from "@cranea/core/nonograma";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { Verdict } from "@/components/tutorial/machine";
import type { TutorialScript } from "@/components/tutorial/types";
import { useT, type T } from "@/lib/i18n";
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

/** El guion, con los textos en el idioma activo. */
const script = (t: T): TutorialScript<S> => ({
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
    { targets: ["board"], text: t("tutorialNonograma.board") },
    { targets: ["col-clue-1"], text: t("tutorialNonograma.runs") },
    {
      targets: [[...ROW1.map(cell), "row-clue-1"]],
      text: t("tutorialNonograma.fullRow"),
      nudge: t("tutorialNonograma.fullRowNudge"),
      check: (s) => paint(s, ROW1, ROW1),
    },
    {
      targets: [[...ROW3.map(cell), "row-clue-3"]],
      text: t("tutorialNonograma.bottomRow"),
      nudge: t("tutorialNonograma.bottomRowNudge"),
      check: (s) => paint(s, [...ROW1, ...ROW3], [...ROW1, ...ROW3]),
    },
    { targets: [["col-clue-0", ...COL0.map(cell)]], text: t("tutorialNonograma.column") },
    {
      targets: [["col-clue-0", ...COL0.map(cell)]],
      anchor: cell(at(2, 0)),
      text: t("tutorialNonograma.middle"),
      nudge: t("tutorialNonograma.middleNudge"),
      check: (s) => paint(s, [...ROW1, ...ROW3, at(2, 0)], [at(2, 0)]),
    },
    {
      targets: ["tool-cross"],
      text: t("tutorialNonograma.crossTool"),
      check: (s) => (paint(s, [...ROW1, ...ROW3, at(2, 0)], []) === "wrong" ? "wrong" : s.tool === "cross" ? "done" : "progress"),
    },
    {
      targets: [cell(at(0, 0))],
      text: t("tutorialNonograma.crossCell"),
      nudge: t("tutorialNonograma.crossCellNudge"),
      check: (s) => {
        const v = paint(s, [...ROW1, ...ROW3, at(2, 0)], [], [at(0, 0)]);
        return v === "ignore" || v === "wrong" ? v : s.board[at(0, 0)] === EMPTY ? "done" : "progress";
      },
    },
    {
      targets: ["board", "tools"],
      anchor: "board",
      text: t("tutorialNonograma.finish"),
      nudge: t("tutorialNonograma.finishNudge"),
      delay: 1000,
      check: (s) => {
        if (s.stroke) return "ignore";
        if (s.status === "won") return "done";
        return s.board.every((v, i) => (v === FILLED ? P.solution[i] : v === EMPTY ? !P.solution[i] : true)) ? "progress" : "wrong";
      },
    },
  ],
  outro: t("tutorialNonograma.outro"),
});

export function NonogramaTutorial() {
  const t = useT();
  const SCRIPT = useMemo(() => script(t), [t]);
  return (
    <>
      <NonogramaGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
