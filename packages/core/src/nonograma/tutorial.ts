import { puzzleFromPicture } from "./clues";

/**
 * Dibujo del tutorial (4×4): las dos filas con 4 se pintan enteras; con eso, los 3 de los costados
 * se cierran (la casilla del medio va, la de arriba no) y los 2 1 del centro terminan el dibujo.
 */
export const TUTORIAL_PUZZLE = puzzleFromPicture("nonograma:tutorial", "Casita", [".##.", "####", "#..#", "####"]);
