import { describe, expect, it } from "vitest";
import {
  generatePalabraDaily, generatePalabraLevel, hardModeError, keyboardStates, normalizeLetter, normalizeWord,
  PALABRA_WORLDS, scoreWord, unpackPalabra, type PackedPalabraLevel,
} from "./index";
import { loadDictionary, malformedWords } from "./words";
import packed from "../../levels/palabra.json";

const dict = loadDictionary();
const levels = packed as PackedPalabraLevel[];

describe("normalización", () => {
  it("quita tildes y diéresis pero conserva la ñ", () => {
    expect(normalizeWord("Árbol")).toBe("arbol");
    expect(normalizeWord("PINGÜINO")).toBe("pinguino");
    expect(normalizeWord("Ñandú")).toBe("ñandu");
    expect(normalizeWord("ñandu")).toBe("ñandu");
    expect(normalizeLetter("Ñ")).toBe("ñ");
    expect(normalizeLetter("é")).toBe("e");
    expect(normalizeLetter("1")).toBeNull();
    expect(normalizeLetter("Enter")).toBeNull();
  });
});

describe("puntaje", () => {
  it("marca verdes, amarillas y grises", () => {
    expect(scoreWord("palta", "pulpo")).toEqual([2, 0, 2, 0, 0]);
    expect(scoreWord("tucan", "conde")).toEqual([1, 0, 1, 0, 0]);
  });
  it("respeta las letras repetidas", () => {
    // Dos erres en el intento, una en su lugar: la otra amarilla solo si sobra una erre.
    expect(scoreWord("perro", "error")).toEqual([1, 1, 2, 1, 0]);
    expect(scoreWord("sanar", "araña")).toEqual([1, 1, 1, 0, 0]);
    // La verde tiene prioridad sobre una amarilla anterior de la misma letra.
    expect(scoreWord("salto", "tacto")).toEqual([0, 2, 0, 2, 2]);
    expect(scoreWord("canal", "aaaaa")).toEqual([0, 2, 0, 2, 0]);
    expect(scoreWord("llama", "lalal")).toEqual([2, 1, 1, 1, 0]);
  });
  it("arma el estado del teclado con la mejor marca de cada letra", () => {
    const states = keyboardStates([
      { word: "error", scores: [1, 1, 2, 1, 0] },
      { word: "nieve", scores: [0, 0, 1, 0, 0] },
    ]);
    expect(states).toMatchObject({ e: 1, r: 2, o: 1, n: 0, i: 0, v: 0 });
  });
});

describe("listas de palabras", () => {
  it("tienen cinco letras jugables y las respuestas se pueden probar", () => {
    expect(malformedWords()).toEqual([]);
    expect(dict.answers.length).toBeGreaterThanOrEqual(800);
    expect(dict.allowed.size).toBeGreaterThan(dict.answers.length * 2);
    for (const word of dict.allowed) expect(word).toMatch(/^[a-zñ]{5}$/);
    for (const word of dict.answers) expect(dict.allowed.has(word)).toBe(true);
    expect(new Set(dict.answers).size).toBe(dict.answers.length);
  });
  it("guardan la forma con tildes para mostrar", () => {
    expect(dict.display.get("arbol")).toBe("árbol");
    expect(dict.display.get("ñandu")).toBe("ñandú");
  });
});

describe("modo difícil", () => {
  it("exige las verdes en su lugar", () => {
    const clue = { word: "palta", scores: scoreWord("pulpo", "palta") }; // P verde, L verde
    expect(hardModeError("pinta", [clue])).toBe("La 3.ª letra tiene que ser L.");
    expect(hardModeError("pulpo", [clue])).toBeNull();
  });
  it("exige usar las amarillas, contando repeticiones", () => {
    const clue = { word: "error", scores: scoreWord("perro", "error") }; // e, r amarillas, r verde, o amarilla
    expect(hardModeError("tarro", [clue])).toBe("Tenés que usar la E.");
    expect(hardModeError("perro", [clue])).toBeNull();
  });
});

describe("niveles publicados", () => {
  it("cubren todos los mundos, sin repetir respuestas, todas jugables", () => {
    for (const world of PALABRA_WORLDS) expect(levels.filter((l) => l.w === world.id).length).toBe(world.levels);
    const answers = levels.map((l) => normalizeWord(l.a));
    expect(new Set(answers).size).toBe(answers.length);
    for (const a of answers) expect(dict.answers).toContain(a);
  });
  it("coinciden con el generador y toman los intentos de su mundo", () => {
    const used = new Set<string>();
    for (const l of levels) {
      const world = PALABRA_WORLDS.find((w) => w.id === l.w)!;
      const p = generatePalabraLevel(world, l.n, dict, used);
      used.add(p.answer);
      expect(p.display).toBe(l.a);
      expect(unpackPalabra(l)).toMatchObject({ answer: p.answer, attempts: world.attempts, hard: world.hard });
    }
  });
});

describe("diario", () => {
  it("es estable, jugable y con seis intentos", () => {
    for (const date of ["2026-10-31", "2026-11-01", "2027-02-14", "2027-10-30"]) {
      const p = generatePalabraDaily(date, dict);
      expect(generatePalabraDaily(date, dict)).toEqual(p);
      expect(dict.answers).toContain(p.answer);
      expect(p.attempts).toBe(6);
      expect(p.hard).toBe(false);
    }
  });
});
