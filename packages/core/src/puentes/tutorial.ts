import { findEdges } from "./board";
import { islandsFromRows } from "./levels";
import { solve } from "./solver";
import type { PuentesPuzzle } from "./types";

/**
 * Tablero del tutorial (5×5, seis islas). El 1 de abajo solo ve al 4 del medio; ese puente corta
 * el que uniría los dos 2, así que cada 2 va doble hacia arriba y el resto se cierra contando.
 */
export const TUTORIAL_ROWS = ["4.4.3", ".....", "2...2", ".....", "..1.."] as const;

const islands = islandsFromRows(TUTORIAL_ROWS);
const edges = findEdges(islands);

export const TUTORIAL_PUZZLE: PuentesPuzzle = {
  id: "puentes:tutorial",
  width: 5,
  height: 5,
  islands,
  edges,
  solution: solve(islands, edges, 1).bridges ?? edges.map(() => 0),
  tier: 1,
  steps: 0,
  difficulty: 0,
};

/** Índice de la isla en una fila y columna (o -1). */
export const islandAt = (p: Pick<PuentesPuzzle, "islands">, r: number, c: number) => p.islands.findIndex((i) => i.r === r && i.c === c);

/** Conexión entre dos islas (o -1). */
export function edgeBetween(p: Pick<PuentesPuzzle, "edges">, a: number, b: number) {
  return p.edges.findIndex((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
}
