"use client";
import { edgeBetween, islandAt, TUTORIAL_PUZZLE as P } from "@cranea/core/puentes";
import { useMemo } from "react";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { Verdict } from "@/components/tutorial/machine";
import type { TutorialScript } from "@/components/tutorial/types";
import { useT, type T } from "@/lib/i18n";
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

const script = (t: T): TutorialScript<S> => ({
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
    { targets: ["board"], text: t("tutorialPuentes.intro") },
    { targets: ["board"], text: t("tutorialPuentes.straight") },
    {
      targets: [[island(ONE), island(MID)]],
      anchor: island(ONE),
      text: t("tutorialPuentes.one"),
      nudge: t("tutorialPuentes.oneNudge"),
      check: (s) => (onlyChanged(s, base({}), [DOWN]) ? reach(s, DOWN, 1) : "wrong"),
    },
    {
      targets: [[island(LEFT2), island(RIGHT2)]],
      text: t("tutorialPuentes.twos"),
      nudge: t("tutorialPuentes.twosNudge"),
      delay: 600,
      check: (s) => (!onlyChanged(s, AFTER_ONE) ? "wrong" : s.notice?.kind === "blocked" ? "done" : "ignore"),
    },
    { targets: [[island(LEFT2), island(RIGHT2)]], text: t("tutorialPuentes.blocked") },
    {
      targets: [[island(LEFT2), island(CORNER)]],
      text: t("tutorialPuentes.leftUp"),
      nudge: t("tutorialPuentes.leftUpNudge"),
      check: (s) => (onlyChanged(s, AFTER_ONE, [LEFT_UP]) ? reach(s, LEFT_UP, 1) : "wrong"),
    },
    {
      targets: [[island(LEFT2), island(CORNER)]],
      text: t("tutorialPuentes.double"),
      nudge: t("tutorialPuentes.doubleNudge"),
      check: (s) => (onlyChanged(s, base({ [DOWN]: 1 }), [LEFT_UP]) && s.bridges[LEFT_UP] > 0 ? reach(s, LEFT_UP, 2) : "wrong"),
    },
    {
      targets: [[island(RIGHT2), island(RIGHT)]],
      text: t("tutorialPuentes.rightUp"),
      nudge: t("tutorialPuentes.rightUpNudge"),
      check: (s) => (onlyChanged(s, AFTER_LEFT, [RIGHT_UP]) ? reach(s, RIGHT_UP, 2) : "wrong"),
    },
    {
      targets: ["board"],
      text: t("tutorialPuentes.finish"),
      nudge: t("tutorialPuentes.finishNudge"),
      delay: 900,
      check: (s) => (s.status === "won" ? "done" : s.bridges.some((b, i) => b > P.solution[i]) ? "wrong" : "progress"),
    },
  ],
  outro: t("tutorialPuentes.outro"),
});

export function PuentesTutorial() {
  const t = useT();
  const SCRIPT = useMemo(() => script(t), [t]);
  return (
    <>
      <PuentesGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
