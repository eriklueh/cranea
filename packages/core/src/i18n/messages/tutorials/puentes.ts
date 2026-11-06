import type { NamespaceShape } from "../../translate";

/** Guion del tutorial de puentes (apps/web/src/games/puentes/tutorial.tsx). */
export const es = {
  intro: "Uní las islas con puentes. Cada número dice cuántos puentes salen de esa isla.",
  straight: "Los puentes van en línea recta, de isla a isla. Entre dos islas puede haber uno o dos.",
  one: "Este 1 ve una sola isla: el 4 de arriba. Tocá el 1 y después el 4.",
  oneNudge: "Uní el 1 con el 4 de arriba.",
  twos: "Ahora probá unir estos dos 2.",
  twosNudge: "Tocá un 2 y después el otro.",
  blocked: "No se puede: cruzaría el puente del 1. Los puentes nunca se cruzan.",
  leftUp: "Entonces este 2 solo puede ir para arriba. Unilo con el 4.",
  leftUpNudge: "Uní el 2 de la izquierda con el 4 de la esquina.",
  double: "Le falta uno más. Tocá el puente para sumar el segundo.",
  doubleNudge: "Tocá el puente que acabás de poner.",
  rightUp: "Con el otro 2 pasa lo mismo. Ponele dos puentes hacia arriba.",
  rightUpNudge: "Dos puentes entre el 2 y el 3 de arriba.",
  finish: "Terminá vos. Al final, todas las islas tienen que quedar unidas en un solo grupo.",
  finishNudge: "Ese puente sobra. Contá lo que le falta a cada isla.",
  outro: "Contar, no cruzar y dejar todo unido. Con eso ya podés jugar.",
};

export const en: NamespaceShape<typeof es> = {
  intro: "Link the islands with bridges. Each number says how many bridges leave that island.",
  straight: "Bridges run in straight lines, island to island. Two islands can share one or two.",
  one: "This 1 only sees one island: the 4 above it. Tap the 1, then the 4.",
  oneNudge: "Link the 1 to the 4 above it.",
  twos: "Now try linking these two 2s.",
  twosNudge: "Tap one 2, then the other.",
  blocked: "Can't do it: it would cross the 1's bridge. Bridges never cross.",
  leftUp: "So this 2 can only go up. Link it to the 4.",
  leftUpNudge: "Link the left 2 to the 4 in the corner.",
  double: "It needs one more. Tap the bridge to add a second.",
  doubleNudge: "Tap the bridge you just built.",
  rightUp: "Same goes for the other 2. Give it two bridges going up.",
  rightUpNudge: "Two bridges between the 2 and the 3 above.",
  finish: "Your turn to finish. In the end, every island has to be linked into one group.",
  finishNudge: "That bridge is extra. Count what each island still needs.",
  outro: "Count, don't cross, and keep it all connected. You're ready to play.",
};
