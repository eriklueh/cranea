import { describe, expect, it } from "vitest";
import {
  alternatives, boardStats, candidates, coversAnswer, generate, generatePalabraDaily, keyboardStates, normalizeLetter,
  normalizeWord, packPalabra, PALABRA_DAILY_CONFIG, PALABRA_WORLDS, patternKey, scoreWord, unpackPalabra,
  type PackedPalabraLevel, type PalabraConfig, type PalabraPuzzle,
} from "./index";
import { loadDictionary, malformedWords } from "./words";
import packed from "../../levels/palabra.json";

const dict = loadDictionary();
const levels = packed as PackedPalabraLevel[];

function expectFair(p: PalabraPuzzle, cfg: PalabraConfig) {
  expect(dict.answers).toContain(p.answer);
  for (const clue of p.clues) {
    expect(dict.answers, `pista ${clue.word}`).toContain(clue.word);
    expect(clue.word).not.toBe(p.answer);
    expect(patternKey(scoreWord(p.answer, clue.word))).toBe(patternKey(clue.scores));
  }
  expect(new Set(p.clues.map((c) => c.word)).size).toBe(p.clues.length);
  // Exactamente una respuesta encaja, y ninguna otra palabra válida tampoco.
  expect(candidates(dict.answers, p.clues)).toEqual([p.answer]);
  expect(alternatives(dict, p.clues, p.answer)).toEqual([]);
  // Cada fila hace falta.
  for (let i = 0; i < p.clues.length; i++) {
    expect(candidates(dict.answers, p.clues.filter((_, j) => j !== i)).length).toBeGreaterThan(1);
  }
  expect(coversAnswer(p.clues, p.answer), "todas las letras de la respuesta se ven en las pistas").toBe(true);
  const s = boardStats(p.clues);
  expect(s.rows).toBeGreaterThanOrEqual(cfg.minRows);
  expect(s.rows).toBeLessThanOrEqual(cfg.maxRows);
  expect(s.greens).toBeGreaterThanOrEqual(cfg.minGreens);
  expect(s.greens).toBeLessThanOrEqual(cfg.maxGreens);
  expect(s.grayRows).toBeLessThanOrEqual(cfg.maxGrayRows);
  for (const clue of p.clues) expect(clue.scores.filter((x) => x === 2).length).toBeLessThanOrEqual(cfg.maxGreensPerRow);
}

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

describe("generador", () => {
  it("es determinístico", () => {
    expect(generate("test:1", PALABRA_WORLDS[1], dict)).toEqual(generate("test:1", PALABRA_WORLDS[1], dict));
  });
  for (const world of PALABRA_WORLDS) {
    it(`mundo ${world.id}: tableros nuevos justos`, () => {
      for (let i = 0; i < 3; i++) expectFair(generate(`test:w${world.id}:${i}`, world, dict), world);
    }, 120_000);
  }
});

describe("niveles publicados", () => {
  it("cubren todos los mundos sin repetir respuestas", () => {
    expect(levels).toHaveLength(PALABRA_WORLDS.reduce((total, w) => total + w.levels, 0));
    expect(new Set(levels.map((l) => normalizeWord(l.a))).size).toBe(levels.length);
  });
  for (const world of PALABRA_WORLDS) {
    it(`mundo ${world.id}: unicidad, balance y curva`, () => {
      const own = levels.filter((l) => l.w === world.id);
      expect(own).toHaveLength(world.levels);
      let previous = -Infinity;
      for (const [i, level] of own.entries()) {
        expect(level.n).toBe(i + 1);
        expect(level.d).toBeGreaterThanOrEqual(previous);
        previous = level.d;
        const p = unpackPalabra(level);
        expect(p.display).toBe(dict.display.get(p.answer));
        expectFair(p, world);
        expect(packPalabra(world.id, i + 1, p)).toEqual(level);
      }
    }, 120_000);
  }
});

describe("diario", () => {
  it("una muestra de fechas da tableros justos y estables", () => {
    const start = Date.parse("2026-10-31T00:00:00Z");
    for (let i = 0; i < 40; i++) {
      const date = new Date(start + i * 9 * 86_400_000).toISOString().slice(0, 10);
      const p = generatePalabraDaily(date, dict);
      expectFair(p, PALABRA_DAILY_CONFIG);
      if (i < 3) expect(generatePalabraDaily(date, dict)).toEqual(p);
    }
  }, 120_000);
});
