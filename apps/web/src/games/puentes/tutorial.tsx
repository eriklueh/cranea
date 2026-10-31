"use client";
import { edgeBetween, islandAt, TUTORIAL_PUZZLE as P } from "@cranea/core/puentes";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { Verdict } from "@/components/tutorial/machine";
import type { TutorialScript } from "@/components/tutorial/types";
import { PuentesGame } from "./components/puentes-game";
import { usePuentes } from "./store";

type S = ReturnType<typeof usePuentes.getState>;

// 4 . 4 . 3
// . . . . .
// 2 . . . 2
// . . . . .
// . . 1 . .
const CORNER = islandAt(P, 0, 0);
const MID = islandAt(P, 0, 2);
const RIGHT = islandAt(P, 0, 4);
const LEFT2 = islandAt(P, 2, 0);
const RIGHT2 = islandAt(P, 2, 4);
const ONE = islandAt(P, 4, 2);
const DOWN = edgeBetween(P, ONE, MID);
const ACROSS = edgeBetween(P, LEFT2, RIGHT2);
const LEFT_UP = edgeBetween(P, LEFT2, CORNER);
const RIGHT_UP = edgeBetween(P, RIGHT2, RIGHT);
const island = (i: number) => `island-${i}`;

/** Puentes que ya tienen que estar puestos al llegar a cada paso. */
const base = (set: Record<number, number>) => P.edges.map((_, i) => set[i] ?? 0);
const AFTER_ONE = base({ [DOWN]: 1 });
const AFTER_LEFT = base({ [DOWN]: 1, [LEFT_UP]: 2 });

/** Solo puede cambiar `free`; el resto tiene que seguir como en `expected`. */
const onlyChanged = (s: S, expected: readonly number[], free: number[] = []) => s.bridges.every((b, i) => free.includes(i) || b === expected[i]);

/** Verdict según cuántos puentes tiene una conexión: `want` termina el paso, lo intermedio es avance. */
const reach = (s: S, edge: number, want: number): Verdict => (s.bridges[edge] === want ? "done" : s.bridges[edge] < want ? "progress" : "wrong");

const SCRIPT: TutorialScript<S> = {
  game: "puentes",
  name: "Puentes",
  levelHref: "/puentes/nivel/1/1",
  homeHref: "/puentes",
  store: usePuentes,
  live: (s) => s.puzzle === P,
  key: (s) => JSON.stringify([s.bridges, s.notice?.kind ?? null, s.status]),
  snapshot: (s) => ({ bridges: s.bridges, history: s.history, notice: s.notice, selected: null, wrong: [], status: s.status, finishedAt: s.finishedAt }),
  reset: () => usePuentes.getState().start(P),
  steps: [
    { targets: ["board"], text: "Uní las islas con puentes. Cada número dice cuántos puentes salen de esa isla." },
    { targets: ["board"], text: "Los puentes van en línea recta, de isla a isla. Entre dos islas puede haber uno o dos." },
    {
      targets: [[island(ONE), island(MID)]],
      anchor: island(ONE),
      text: "Este 1 ve una sola isla: el 4 de arriba. Tocá el 1 y después el 4.",
      nudge: "Uní el 1 con el 4 de arriba.",
      check: (s) => (onlyChanged(s, base({}), [DOWN]) ? reach(s, DOWN, 1) : "wrong"),
    },
    {
      targets: [[island(LEFT2), island(RIGHT2)]],
      text: "Ahora probá unir estos dos 2.",
      nudge: "Tocá un 2 y después el otro.",
      delay: 600,
      check: (s) => (!onlyChanged(s, AFTER_ONE) ? "wrong" : s.notice?.kind === "blocked" ? "done" : "ignore"),
    },
    { targets: [[island(LEFT2), island(RIGHT2)]], text: "No se puede: cruzaría el puente del 1. Los puentes nunca se cruzan." },
    {
      targets: [[island(LEFT2), island(CORNER)]],
      text: "Entonces este 2 solo puede ir para arriba. Unilo con el 4.",
      nudge: "Uní el 2 de la izquierda con el 4 de la esquina.",
      check: (s) => (onlyChanged(s, AFTER_ONE, [LEFT_UP]) ? reach(s, LEFT_UP, 1) : "wrong"),
    },
    {
      targets: [[island(LEFT2), island(CORNER)]],
      text: "Le falta uno más. Tocá el puente para sumar el segundo.",
      nudge: "Tocá el puente que acabás de poner.",
      check: (s) => (onlyChanged(s, base({ [DOWN]: 1 }), [LEFT_UP]) && s.bridges[LEFT_UP] > 0 ? reach(s, LEFT_UP, 2) : "wrong"),
    },
    {
      targets: [[island(RIGHT2), island(RIGHT)]],
      text: "Con el otro 2 pasa lo mismo. Ponele dos puentes hacia arriba.",
      nudge: "Dos puentes entre el 2 y el 3 de arriba.",
      check: (s) => (onlyChanged(s, AFTER_LEFT, [RIGHT_UP]) ? reach(s, RIGHT_UP, 2) : "wrong"),
    },
    {
      targets: ["board"],
      text: "Terminá vos. Al final, todas las islas tienen que quedar unidas en un solo grupo.",
      nudge: "Ese puente sobra. Contá lo que le falta a cada isla.",
      delay: 900,
      check: (s) => (s.status === "won" ? "done" : s.bridges.some((b, i) => b > P.solution[i]) ? "wrong" : "progress"),
    },
  ],
  outro: "Contar, no cruzar y dejar todo unido. Con eso ya podés jugar.",
};

export function PuentesTutorial() {
  return (
    <>
      <PuentesGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
