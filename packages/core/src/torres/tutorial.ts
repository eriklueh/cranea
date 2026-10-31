import type { TorresPuzzle } from "./types";

/**
 * Ciudad del tutorial (3×3, dos pistas). El 1 de arriba pone un 3 en la esquina; el 3 de la izquierda
 * ordena la fila del medio 1 2 3; el resto sale de no repetir alturas.
 */
export const TUTORIAL_PUZZLE: TorresPuzzle = {
  id: "torres:tutorial",
  size: 3,
  clues: { top: [1, 0, 0], bottom: [0, 0, 0], left: [0, 3, 0], right: [0, 0, 0] },
  givens: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  solution: [3, 1, 2, 1, 2, 3, 2, 3, 1],
  tier: 1,
  steps: 0,
  difficulty: 0,
};
