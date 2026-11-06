"use client";
import { useMemo } from "react";
import { TUTORIAL_PUZZLE as P } from "@cranea/core/torres";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { TutorialScript } from "@/components/tutorial/types";
import { useT, type T } from "@/lib/i18n";
import { TorresGame } from "./components/torres-game";
import { useTorres } from "./store";

type S = ReturnType<typeof useTorres.getState>;

// 1 arriba de la columna 1 y 3 a la izquierda de la fila 2:
// 3 1 2
// 1 2 3
// 2 3 1
const cell = (i: number) => `cell-${i}`;
const ROW1 = [3, 4, 5];
const BOTH = 0b011;

/** Las alturas puestas coinciden con la solución y solo están en `cells`. */
const placed = (s: S, cells: readonly number[]) => s.values.every((v, i) => (v ? cells.includes(i) && v === P.solution[i] : true));
const noNotes = (s: S, except: number[] = []) => s.notes.every((n, i) => !n || except.includes(i));

/** El guion, con los textos en el idioma activo. */
const script = (t: T): TutorialScript<S> => ({
  game: "torres",
  name: "Torres",
  levelHref: "/torres/nivel/1/1",
  homeHref: "/torres",
  store: useTorres,
  live: (s) => s.puzzle === P,
  key: (s) => JSON.stringify([s.values, s.notes, s.notesMode, s.status]),
  snapshot: (s) => ({ values: s.values, notes: s.notes, notesMode: s.notesMode, history: s.history, status: s.status, finishedAt: s.finishedAt, wrong: [], check: null }),
  reset: () => useTorres.getState().start(P),
  steps: [
    { targets: ["board"], text: t("tutorialTorres.board") },
    { targets: ["clue-top-0"], text: t("tutorialTorres.clues") },
    {
      targets: ["clue-top-0", cell(0), "pad"],
      anchor: "clue-top-0",
      text: t("tutorialTorres.first"),
      nudge: t("tutorialTorres.firstNudge"),
      check: (s) => (s.notesMode || !noNotes(s) ? "wrong" : s.values[0] === 3 && placed(s, [0]) ? "done" : s.values.every((v) => !v) ? "progress" : "wrong"),
    },
    {
      targets: [cell(1), "notes", "pad"],
      anchor: cell(1),
      text: t("tutorialTorres.notes"),
      nudge: t("tutorialTorres.notesNudge"),
      check: (s) => (!placed(s, [0]) || s.values[0] !== 3 || !noNotes(s, [1]) ? "wrong" : s.notes[1] === BOTH ? "done" : "progress"),
    },
    {
      targets: ["notes"],
      text: t("tutorialTorres.notesOff"),
      check: (s) => (s.notes[1] !== BOTH || !placed(s, [0]) ? "wrong" : s.notesMode ? "progress" : "done"),
    },
    {
      targets: ["clue-left-1", ROW1.map(cell), "pad"],
      anchor: ROW1.map(cell),
      text: t("tutorialTorres.row"),
      nudge: t("tutorialTorres.rowNudge"),
      check: (s) => (s.notesMode || !placed(s, [0, ...ROW1]) ? "wrong" : ROW1.every((i) => s.values[i]) ? "done" : "progress"),
    },
    {
      targets: [[cell(1), cell(4), cell(7)], "pad"],
      anchor: [cell(1), cell(4), cell(7)],
      text: t("tutorialTorres.column"),
      nudge: t("tutorialTorres.columnNudge"),
      check: (s) => (s.notesMode || !placed(s, [0, 1, ...ROW1]) ? "wrong" : s.values[1] === 1 ? "done" : "progress"),
    },
    {
      targets: ["board", "pad"],
      anchor: "board",
      text: t("tutorialTorres.finish"),
      nudge: t("tutorialTorres.finishNudge"),
      delay: 900,
      check: (s) => (s.status === "won" ? "done" : s.values.every((v, i) => !v || v === P.solution[i]) ? "progress" : "wrong"),
    },
  ],
  outro: t("tutorialTorres.outro"),
});

export function TorresTutorial() {
  const t = useT();
  const SCRIPT = useMemo(() => script(t), [t]);
  return (
    <>
      <TorresGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
