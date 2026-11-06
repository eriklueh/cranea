"use client";
import { TUTORIAL_PUZZLE as P } from "@cranea/core/cifra";
import { useMemo } from "react";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { TutorialScript } from "@/components/tutorial/types";
import { useT, type T } from "@/lib/i18n";
import { CifraGame } from "./components/cifra-game";
import { useCifra } from "./store";

type S = ReturnType<typeof useCifra.getState>;

const ROW0 = ["0:0", "0:1", "0:2"];
const row0Out = (s: S) => ROW0.every((k) => s.marks[k] === "out");
const untouchedCode = (s: S) => s.input.length === 0 && s.misses.length === 0;

/** Tablero 147 · 318 · 593 → 358 (ver packages/core/src/cifra/tutorial.ts). */
const script = (t: T): TutorialScript<S> => ({
  game: "cifra",
  name: "Cifra",
  levelHref: "/cifra/nivel/2/1",
  homeHref: "/cifra",
  store: useCifra,
  live: (s) => s.puzzle === P,
  key: (s) => JSON.stringify([s.input, s.misses.length, s.marks, s.status]),
  snapshot: (s) => ({ input: s.input, misses: s.misses, marks: s.marks, status: s.status, clearedMarks: null }),
  reset: () => useCifra.getState().start(P),
  steps: [
    { targets: ["clues"], text: t("tutorialCifra.intro") },
    { targets: ["clue-0"], text: t("tutorialCifra.pegs") },
    {
      targets: ["clue-0"],
      text: t("tutorialCifra.row0"),
      nudge: t("tutorialCifra.row0Nudge"),
      check: (s) => {
        if (!untouchedCode(s)) return "wrong";
        const keys = Object.keys(s.marks);
        if (keys.some((k) => !ROW0.includes(k) || s.marks[k] !== "out")) return "wrong";
        return keys.length === 3 ? "done" : "progress";
      },
    },
    { targets: ["clue-1"], text: t("tutorialCifra.row1") },
    {
      targets: ["clue-1"],
      text: t("tutorialCifra.row1Mark"),
      nudge: t("tutorialCifra.row1MarkNudge"),
      check: (s) => {
        if (!untouchedCode(s) || !row0Out(s)) return "wrong";
        for (const [k, v] of Object.entries(s.marks)) {
          if (ROW0.includes(k)) continue;
          if (k === "1:1" ? v !== "out" : k !== "1:0" && k !== "1:2") return "wrong";
        }
        return s.marks["1:0"] === "here" && s.marks["1:2"] === "here" ? "done" : "progress";
      },
    },
    { targets: ["clue-2"], text: t("tutorialCifra.row2") },
    { targets: ["clue-2"], text: t("tutorialCifra.row2Middle") },
    {
      targets: ["code", "keypad"],
      anchor: ["code", "keypad"],
      text: t("tutorialCifra.code"),
      nudge: t("tutorialCifra.codeNudge"),
      delay: 700,
      check: (s) => {
        if (s.status === "won") return "done";
        if (s.misses.length || s.status !== "playing") return "wrong";
        return s.input.every((d, i) => d === P.solution[i]) ? "progress" : "wrong";
      },
    },
  ],
  outro: t("tutorialCifra.outro"),
});

export function CifraTutorial() {
  const t = useT();
  const SCRIPT = useMemo(() => script(t), [t]);
  return (
    <>
      <CifraGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
