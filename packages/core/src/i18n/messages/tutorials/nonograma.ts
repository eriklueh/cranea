import type { NamespaceShape } from "../../translate";

/** Guion del tutorial de nonograma (apps/web/src/games/nonograma/tutorial.tsx). */
export const es = {
  board: "Pintá casillas para descubrir un dibujo. Los números de cada fila y columna te dicen cuáles.",
  runs: "Cada número es un tramo de casillas pintadas seguidas. 2 y 1 es: dos juntas, un hueco y una.",
  fullRow: "Este 4 pide cuatro seguidas, y la fila tiene cuatro. Pintala entera: tocá o deslizá el dedo.",
  fullRowNudge: "Pintá solo esta fila.",
  bottomRow: "La de abajo también pide 4. Pintala.",
  bottomRowNudge: "Pintá solo la fila de abajo.",
  column: "Este 3 pide tres seguidas. Ya hay dos pintadas, con un hueco en el medio.",
  middle: "Para que queden tres juntas, pintá la del medio.",
  middleNudge: "Pintá la casilla vacía entre las dos.",
  crossTool: "Y la de arriba sobra: ahí no va nada. Elegí la cruz.",
  crossCell: "Tocá esa casilla para marcarla con una cruz.",
  crossCellNudge: "Marcá con cruz la casilla de arriba.",
  finish: "Terminá el dibujo. Cuando una línea cumple su número, se apaga.",
  finishNudge: "Esa no va. Mirá los números.",
  outro: "Leé los números, pintá lo seguro y cruzá lo que sobra. El nivel 1 es de 5 por 5.",
};

export const en: NamespaceShape<typeof es> = {
  board: "Fill in squares to reveal a picture. The numbers on each row and column tell you which ones.",
  runs: "Each number is a run of filled squares in a row. 2 and 1 means: two together, a gap, then one.",
  fullRow: "This 4 needs four in a row, and the row has four squares. Fill it all: tap or drag your finger.",
  fullRowNudge: "Fill only this row.",
  bottomRow: "The bottom row also needs 4. Fill it.",
  bottomRowNudge: "Fill only the bottom row.",
  column: "This 3 needs three in a row. Two are already filled, with a gap in between.",
  middle: "To make three together, fill the middle one.",
  middleNudge: "Fill the empty square between the two.",
  crossTool: "And the top one is extra: nothing goes there. Pick the cross.",
  crossCell: "Tap that square to mark it with a cross.",
  crossCellNudge: "Cross out the top square.",
  finish: "Finish the picture. When a line matches its numbers, they fade.",
  finishNudge: "That one doesn't go. Check the numbers.",
  outro: "Read the numbers, fill what's certain and cross out the rest. Level 1 is 5 by 5.",
};
