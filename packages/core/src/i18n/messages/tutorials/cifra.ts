import type { NamespaceShape } from "../../translate";

/** Guion del tutorial de cifra (apps/web/src/games/cifra/tutorial.tsx). */
export const es = {
  intro: "Hay un código secreto de tres cifras distintas. Estas filas son intentos que ya tienen puntaje.",
  pegs: "El círculo lleno cuenta las cifras que están en su lugar. El aro, las que están en otro lugar.",
  row0: "Esta fila tiene 0 y 0: ni el 1, ni el 4, ni el 7 están. Tocá las tres para tacharlas.",
  row0Nudge: "Un toque por ficha: así queda tachada.",
  row1: "Acá hay dos en su lugar. El 1 ya sabés que no está. Entonces el 3 y el 8 van justo ahí.",
  row1Mark: "Tocá el 3 hasta que quede verde: tachada, aro, verde. Después lo mismo con el 8.",
  row1MarkNudge: "Marcá el 3 y el 8 de esta fila.",
  row2: "Aro 2: dos están, pero corridas. Una es el 3, que va primero. La otra es el 5 o el 9.",
  row2Middle: "El 9 está en el medio, y ahí no puede ir. El medio es el único lugar libre: va el 5.",
  code: "Escribí el código 358 y tocá Probar código.",
  codeNudge: "El código es 3, 5 y 8.",
  outro: "Ya sabés leer las filas y cruzarlas. El nivel 1 tiene cuatro cifras.",
};

export const en: NamespaceShape<typeof es> = {
  intro: "There's a secret code of three different digits. These rows are guesses that are already scored.",
  pegs: "The filled dot counts digits in the right spot. The ring counts digits that are in the code but in another spot.",
  row0: "This row scores 0 and 0: no 1, no 4, no 7. Tap all three to cross them out.",
  row0Nudge: "One tap per tile crosses it out.",
  row1: "Two here are in the right spot. You already know 1 is out. So 3 and 8 go right there.",
  row1Mark: "Tap the 3 until it turns green: crossed out, ring, green. Then do the same with the 8.",
  row1MarkNudge: "Mark the 3 and the 8 in this row.",
  row2: "Ring 2: two are in the code, but in other spots. One is the 3, which goes first. The other is 5 or 9.",
  row2Middle: "The 9 is in the middle, so it can't go there. The middle is the only open spot: it's the 5.",
  code: "Enter the code 358 and tap Try code.",
  codeNudge: "The code is 3, 5 and 8.",
  outro: "Now you can read the rows and cross-check them. Level 1 has four digits.",
};
