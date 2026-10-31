import type { PalabraPuzzle } from "./types";

/**
 * Palabra del tutorial: PALTA da P y T verdes, A y L amarillas y la segunda A gris (hay una sola).
 * Con eso, PLATO entra justo. Las dos están en la lista de palabras.
 */
export const TUTORIAL_FIRST_GUESS = "palta";
export const TUTORIAL_PUZZLE: PalabraPuzzle = { id: "palabra:tutorial", answer: "plato", display: "plato", attempts: 4, hard: false };
