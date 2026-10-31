"use client";
import { TUTORIAL_PUZZLE as P } from "@cranea/core/torres";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { TutorialScript } from "@/components/tutorial/types";
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

const SCRIPT: TutorialScript<S> = {
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
    { targets: ["board"], text: "Cada casilla es una torre de 1 a 3 pisos. En cada fila y cada columna, cada altura va una sola vez." },
    { targets: ["clue-top-0"], text: "Los números del borde dicen cuántas torres se ven desde ahí. Las altas tapan a las bajas." },
    {
      targets: ["clue-top-0", cell(0), "pad"],
      anchor: "clue-top-0",
      text: "Desde acá se ve una sola. Entonces la primera es la más alta: poné un 3.",
      nudge: "Si se ve una sola, la primera es la de 3.",
      check: (s) => (s.notesMode || !noNotes(s) ? "wrong" : s.values[0] === 3 && placed(s, [0]) ? "done" : s.values.every((v) => !v) ? "progress" : "wrong"),
    },
    {
      targets: [cell(1), "notes", "pad"],
      anchor: cell(1),
      text: "¿Y acá? Va 1 o 2, porque el 3 ya está en la fila. Anotalo: tocá Notas, la casilla, el 1 y el 2.",
      nudge: "Primero tocá Notas. Después anotá 1 y 2 en esta casilla.",
      check: (s) => (!placed(s, [0]) || s.values[0] !== 3 || !noNotes(s, [1]) ? "wrong" : s.notes[1] === BOTH ? "done" : "progress"),
    },
    {
      targets: ["notes"],
      text: "Así anotás cuando dudás. Tocá Notas otra vez para volver a poner alturas.",
      check: (s) => (s.notes[1] !== BOTH || !placed(s, [0]) ? "wrong" : s.notesMode ? "progress" : "done"),
    },
    {
      targets: ["clue-left-1", ROW1.map(cell), "pad"],
      anchor: ROW1.map(cell),
      text: "Desde acá se ven las tres. Entonces van de menor a mayor: 1, 2 y 3.",
      nudge: "De izquierda a derecha: 1, 2 y 3.",
      check: (s) => (s.notesMode || !placed(s, [0, ...ROW1]) ? "wrong" : ROW1.every((i) => s.values[i]) ? "done" : "progress"),
    },
    {
      targets: [[cell(1), cell(4), cell(7)], "pad"],
      anchor: [cell(1), cell(4), cell(7)],
      text: "Esta columna ya tiene un 2. Entonces arriba va el 1. Tocá la casilla y poné un 1.",
      nudge: "La casilla de arriba de esta columna lleva un 1.",
      check: (s) => (s.notesMode || !placed(s, [0, 1, ...ROW1]) ? "wrong" : s.values[1] === 1 ? "done" : "progress"),
    },
    {
      targets: ["board", "pad"],
      anchor: "board",
      text: "Completá el resto sin repetir alturas en ninguna fila ni columna.",
      nudge: "Esa altura no va. Mirá la fila y la columna.",
      delay: 900,
      check: (s) => (s.status === "won" ? "done" : s.values.every((v, i) => !v || v === P.solution[i]) ? "progress" : "wrong"),
    },
  ],
  outro: "Mirá los bordes, no repitas alturas y anotá cuando dudes. El nivel 1 es de 4 por 4.",
};

export function TorresTutorial() {
  return (
    <>
      <TorresGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
