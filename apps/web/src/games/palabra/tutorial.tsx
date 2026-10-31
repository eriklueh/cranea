"use client";
import { TUTORIAL_FIRST_GUESS as FIRST, TUTORIAL_PUZZLE as P } from "@cranea/core/palabra";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import type { TutorialScript } from "@/components/tutorial/types";
import { PalabraGame } from "./components/palabra-game";
import { usePalabra } from "./store";

type S = ReturnType<typeof usePalabra.getState>;

/** Lo que se va escribiendo tiene que ser el comienzo de la palabra pedida. */
const typing = (s: S, word: string) => word.startsWith(s.input.join(""));

/** PALTA → P y T verdes, A y L amarillas, la otra A gris; después PLATO (ver packages/core/src/palabra/tutorial.ts). */
const SCRIPT: TutorialScript<S> = {
  game: "palabra",
  name: "Palabra",
  levelHref: "/palabra/nivel/1/1",
  homeHref: "/palabra",
  store: usePalabra,
  live: (s) => s.puzzle === P,
  key: (s) => JSON.stringify([s.input, s.misses.length, s.status]),
  snapshot: (s) => ({ input: s.input, misses: s.misses, status: s.status, finishedAt: s.finishedAt, message: null }),
  reset: () => usePalabra.getState().start(P),
  steps: [
    { targets: [["row-0", "row-1", "row-2", "row-3"]], text: "Hay una palabra secreta de cinco letras. Tenés cuatro intentos para encontrarla." },
    {
      targets: ["row-0", "keyboard"],
      anchor: "keyboard",
      text: "Empezá con PALTA: escribila y tocá Probar.",
      nudge: "Escribí P, A, L, T, A.",
      delay: 1100,
      check: (s) => {
        if (s.misses.length) return s.misses.length === 1 && s.misses[0].word === FIRST ? "done" : "wrong";
        return typing(s, FIRST) ? "progress" : "wrong";
      },
    },
    { targets: ["row-0"], text: "Verde: la letra está y va ahí. La P y la T ya quedan." },
    { targets: ["row-0"], text: "Amarilla: está, pero en otro lugar. La A y la L van corridas." },
    { targets: ["row-0"], text: "Gris: no va. Esta A sale gris porque hay una sola A, y ya la marcó la amarilla." },
    { targets: ["keyboard"], text: "El teclado también se pinta. Así ves qué letras ya probaste." },
    {
      targets: ["row-1", "keyboard"],
      anchor: "keyboard",
      text: "Usá lo que sabés: P y T quedan, la L y la A cambian de lugar. Probá PLATO.",
      nudge: "Escribí P, L, A, T, O.",
      delay: 1500,
      check: (s) => {
        if (s.status === "won") return "done";
        if (s.misses.length !== 1 || s.status !== "playing") return "wrong";
        return typing(s, P.answer) ? "progress" : "wrong";
      },
    },
  ],
  outro: "Cada intento te da pistas para el próximo. En el nivel 1 tenés seis intentos.",
};

export function PalabraTutorial() {
  return (
    <>
      <PalabraGame puzzle={P} mode={{ kind: "tutorial" }} />
      <TutorialOverlay script={SCRIPT} />
    </>
  );
}
