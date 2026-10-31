import type { CifraPuzzle } from "./types";

/**
 * Tablero del tutorial: tres cifras y tres filas, hecho a mano.
 * 1) 147 en cero descarta 1, 4 y 7. 2) En 318 dos van en su lugar y el 1 no va: 3 y 8 van ahí.
 * 3) En 593 hay dos en otro lugar: una es el 3; el 9 no puede ir en el medio, así que el 5 va ahí. Código: 358.
 */
export const TUTORIAL_PUZZLE: CifraPuzzle = {
  id: "cifra:tutorial",
  length: 3,
  clues: [
    { guess: [1, 4, 7], feedback: { exact: 0, present: 0 } },
    { guess: [3, 1, 8], feedback: { exact: 2, present: 0 } },
    { guess: [5, 9, 3], feedback: { exact: 0, present: 2 } },
  ],
  solution: [3, 5, 8],
  tier: 1,
  steps: 3,
  difficulty: 0,
};
