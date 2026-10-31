import { describe, expect, it } from "vitest";
import * as cifra from "./cifra";
import * as puentes from "./puentes";
import * as nonograma from "./nonograma";
import * as palabra from "./palabra";
import * as torres from "./torres";
import { loadDictionary } from "./palabra/words";

/** Los tableros del tutorial están hechos a mano: tienen que tener una sola solución y salir sin adivinar. */
describe("tableros del tutorial", () => {
  it("Cifra: un solo código, que sale con lectura directa y cruce de filas", () => {
    const p = cifra.TUTORIAL_PUZZLE;
    expect(cifra.candidates(p.clues, p.length)).toEqual([[...p.solution]]);
    for (const c of p.clues) expect(cifra.score(p.solution, c.guess)).toEqual(c.feedback);
    const r = cifra.solve(p.clues, p.length);
    expect(r.solved).toBe(true);
    expect(r.tier).toBeLessThanOrEqual(2);
  });

  it("Palabra: los intentos guiados están en la lista y pintan lo que dice el guion", () => {
    const dict = loadDictionary();
    const p = palabra.TUTORIAL_PUZZLE;
    expect(dict.allowed.has(palabra.TUTORIAL_FIRST_GUESS)).toBe(true);
    expect(palabra.scoreWord(p.answer, palabra.TUTORIAL_FIRST_GUESS)).toEqual([2, 1, 1, 2, 0]);
  });

  it("Puentes: solución única por conteo, y el 1 de abajo corta el puente entre los 2", () => {
    const p = puentes.TUTORIAL_PUZZLE;
    expect(puentes.countSolutions(p.islands, p.edges)).toBe(1);
    expect(puentes.solve(p.islands, p.edges, 1).solved).toBe(true);
    expect(puentes.isSolved(p.islands, p.edges, p.solution)).toBe(true);
    const one = puentes.islandAt(p, 4, 2);
    const mid = puentes.islandAt(p, 0, 2);
    const left = puentes.islandAt(p, 2, 0);
    const right = puentes.islandAt(p, 2, 4);
    const corner = puentes.islandAt(p, 0, 0);
    const down = puentes.edgeBetween(p, one, mid);
    const across = puentes.edgeBetween(p, left, right);
    expect(p.solution[down]).toBe(1);
    expect(p.solution[across]).toBe(0);
    expect(puentes.crossingMap(p.islands, p.edges)[down]).toContain(across);
    expect(p.solution[puentes.edgeBetween(p, corner, left)]).toBe(2);
  });

  it("Nonograma: más chico que el nivel 1 y resoluble por líneas", () => {
    const p = nonograma.TUTORIAL_PUZZLE;
    expect(p.width).toBeLessThan(5);
    expect(nonograma.countSolutions(p.rows, p.cols)).toBe(1);
    expect(nonograma.solve(p.rows, p.cols).solved).toBe(true);
    expect(p.rows).toEqual([[2], [4], [1, 1], [4]]);
    expect(p.cols).toEqual([[3], [2, 1], [2, 1], [3]]);
  });

  it("Torres: un cuadrado latino que cumple las pistas, con solución única", () => {
    const p = torres.TUTORIAL_PUZZLE;
    expect(torres.isSolved(p.solution, p.size, p.clues, p.givens)).toBe(true);
    expect(torres.countSolutions(p)).toBe(1);
    expect(torres.solve(p).solved).toBe(true);
  });
});
