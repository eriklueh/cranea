"use client";
import { TUTORIAL_PUZZLE as P } from "@cranea/core/cifra";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { TutorialScript } from "@/components/tutorial/types";
import { CifraGame } from "./components/cifra-game";
import { useCifra } from "./store";

type S = ReturnType<typeof useCifra.getState>;

const ROW0 = ["0:0", "0:1", "0:2"];
const row0Out = (s: S) => ROW0.every((k) => s.marks[k] === "out");
const untouchedCode = (s: S) => s.input.length === 0 && s.misses.length === 0;

/** Tablero 147 · 318 · 593 → 358 (ver packages/core/src/cifra/tutorial.ts). */
const SCRIPT: TutorialScript<S> = {
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
    { targets: ["clues"], text: "Hay un código secreto de tres cifras distintas. Estas filas son intentos que ya tienen puntaje." },
    { targets: ["clue-0"], text: "El círculo lleno cuenta las cifras que están en su lugar. El aro, las que están en otro lugar." },
    {
      targets: ["clue-0"],
      text: "Esta fila tiene 0 y 0: ni el 1, ni el 4, ni el 7 están. Tocá las tres para tacharlas.",
      nudge: "Un toque por ficha: así queda tachada.",
      check: (s) => {
        if (!untouchedCode(s)) return "wrong";
        const keys = Object.keys(s.marks);
        if (keys.some((k) => !ROW0.includes(k) || s.marks[k] !== "out")) return "wrong";
        return keys.length === 3 ? "done" : "progress";
      },
    },
    { targets: ["clue-1"], text: "Acá hay dos en su lugar. El 1 ya sabés que no está. Entonces el 3 y el 8 van justo ahí." },
    {
      targets: ["clue-1"],
      text: "Tocá el 3 hasta que quede verde: tachada, aro, verde. Después lo mismo con el 8.",
      nudge: "Marcá el 3 y el 8 de esta fila.",
      check: (s) => {
        if (!untouchedCode(s) || !row0Out(s)) return "wrong";
        for (const [k, v] of Object.entries(s.marks)) {
          if (ROW0.includes(k)) continue;
          if (k === "1:1" ? v !== "out" : k !== "1:0" && k !== "1:2") return "wrong";
        }
        return s.marks["1:0"] === "here" && s.marks["1:2"] === "here" ? "done" : "progress";
      },
    },
    { targets: ["clue-2"], text: "Aro 2: dos están, pero corridas. Una es el 3, que va primero. La otra es el 5 o el 9." },
    { targets: ["clue-2"], text: "El 9 está en el medio, y ahí no puede ir. El medio es el único lugar libre: va el 5." },
    {
      targets: ["code", "keypad"],
      anchor: ["code", "keypad"],
      text: "Escribí el código 358 y tocá Probar código.",
      nudge: "El código es 3, 5 y 8.",
      delay: 700,
      check: (s) => {
        if (s.status === "won") return "done";
        if (s.misses.length || s.status !== "playing") return "wrong";
        return s.input.every((d, i) => d === P.solution[i]) ? "progress" : "wrong";
      },
    },
  ],
  outro: "Ya sabés leer las filas y cruzarlas. El nivel 1 tiene cuatro cifras.",
};

export function CifraTutorial() {
  return (
    <>
      <CifraGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
