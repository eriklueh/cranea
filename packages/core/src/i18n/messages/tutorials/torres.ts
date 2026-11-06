import type { NamespaceShape } from "../../translate";

/** Guion del tutorial de torres (apps/web/src/games/torres/tutorial.tsx). */
export const es = {
  board: "Cada casilla es una torre de 1 a 3 pisos. En cada fila y cada columna, cada altura va una sola vez.",
  clues: "Los números del borde dicen cuántas torres se ven desde ahí. Las altas tapan a las bajas.",
  first: "Desde acá se ve una sola. Entonces la primera es la más alta: poné un 3.",
  firstNudge: "Si se ve una sola, la primera es la de 3.",
  notes: "¿Y acá? Va 1 o 2, porque el 3 ya está en la fila. Anotalo: tocá Notas, la casilla, el 1 y el 2.",
  notesNudge: "Primero tocá Notas. Después anotá 1 y 2 en esta casilla.",
  notesOff: "Así anotás cuando dudás. Tocá Notas otra vez para volver a poner alturas.",
  row: "Desde acá se ven las tres. Entonces van de menor a mayor: 1, 2 y 3.",
  rowNudge: "De izquierda a derecha: 1, 2 y 3.",
  column: "Esta columna ya tiene un 2. Entonces arriba va el 1. Tocá la casilla y poné un 1.",
  columnNudge: "La casilla de arriba de esta columna lleva un 1.",
  finish: "Completá el resto sin repetir alturas en ninguna fila ni columna.",
  finishNudge: "Esa altura no va. Mirá la fila y la columna.",
  outro: "Mirá los bordes, no repitas alturas y anotá cuando dudes. El nivel 1 es de 4 por 4.",
};

export const en: NamespaceShape<typeof es> = {
  board: "Each square is a tower 1 to 3 stories tall. Every height appears once in each row and column.",
  clues: "The numbers on the edge say how many towers you can see from there. Tall ones hide short ones.",
  first: "From here you see just one. So the first is the tallest: put a 3.",
  firstNudge: "If you only see one, the first one is the 3.",
  notes: "What about here? It's 1 or 2, since the row already has a 3. Note it: tap Notes, the square, then 1 and 2.",
  notesNudge: "Tap Notes first. Then note 1 and 2 in this square.",
  notesOff: "That's how you take notes when unsure. Tap Notes again to go back to heights.",
  row: "From here you see all three. So they go shortest to tallest: 1, 2 and 3.",
  rowNudge: "Left to right: 1, 2 and 3.",
  column: "This column already has a 2. So the top one is 1. Tap the square and put a 1.",
  columnNudge: "The top square in this column gets a 1.",
  finish: "Fill in the rest without repeating a height in any row or column.",
  finishNudge: "That height doesn't fit. Check the row and column.",
  outro: "Watch the edges, don't repeat heights and take notes when unsure. Level 1 is 4 by 4.",
};
