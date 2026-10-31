import { describe, expect, it } from "vitest";
import {
  countSolutions, DAILY_CONFIG, findEdges, generate, generateDaily, isSolved, pack, selectDifficultyCurve, solve, unpack, WORLDS,
  type PackedLevel, type PuentesConfig, type PuentesPuzzle,
} from "./index";
import packed from "../../levels/puentes.json";

/** Búsqueda independiente: no usa findEdges, crossingMap ni el solver de producción. */
function bruteForceSolutions(rows: readonly string[], limit = 2): number[][] {
  const islands: { r: number; c: number; n: number }[] = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => ch !== "." && islands.push({ r, c, n: Number(ch) })));
  const id = new Map(islands.map((p, i) => [`${p.r},${p.c}`, i]));
  const pairs: { a: number; b: number; cells: string[] }[] = [];
  islands.forEach((p, a) => {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const cells: string[] = [];
      for (let r = p.r + dr, c = p.c + dc; r < rows.length && c < rows[0].length; r += dr, c += dc) {
        const b = id.get(`${r},${c}`);
        if (b !== undefined) { pairs.push({ a, b, cells }); break; }
        cells.push(`${r},${c}`);
      }
    }
  });
  const lastUse = islands.map((_, i) => Math.max(-1, ...pairs.map((p, k) => (p.a === i || p.b === i ? k : -1))));
  const sums = islands.map(() => 0);
  const occupied = new Set<string>();
  const value = pairs.map(() => 0);
  const out: number[][] = [];
  const connected = () => {
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) {
      const x = stack.pop()!;
      pairs.forEach((p, k) => {
        if (!value[k] || (p.a !== x && p.b !== x)) return;
        const y = p.a === x ? p.b : p.a;
        if (!seen.has(y)) { seen.add(y); stack.push(y); }
      });
    }
    return seen.size === islands.length;
  };
  const visit = (k: number) => {
    if (out.length >= limit) return;
    if (k === pairs.length) {
      if (sums.every((s, i) => s === islands[i].n) && connected()) out.push(value.slice());
      return;
    }
    const { a, b, cells } = pairs[k];
    for (let v = 0; v <= 2; v++) {
      if (v > 0 && cells.some((c) => occupied.has(c))) break;
      if (sums[a] + v > islands[a].n || sums[b] + v > islands[b].n) break;
      sums[a] += v;
      sums[b] += v;
      const closedOk = [a, b].every((i) => lastUse[i] !== k || sums[i] === islands[i].n);
      if (closedOk) {
        if (v > 0) cells.forEach((c) => occupied.add(c));
        value[k] = v;
        visit(k + 1);
        value[k] = 0;
        if (v > 0) cells.forEach((c) => occupied.delete(c));
      }
      sums[a] -= v;
      sums[b] -= v;
    }
  };
  visit(0);
  return out;
}

function expectValid(p: PuentesPuzzle, cfg: PuentesConfig) {
  expect(p.width).toBe(cfg.width);
  expect(p.height).toBe(cfg.height);
  expect(p.islands.length).toBeGreaterThanOrEqual(cfg.minIslands);
  expect(p.islands.length).toBeLessThanOrEqual(cfg.maxIslands);
  for (const island of p.islands) {
    expect(island.n).toBeGreaterThanOrEqual(1);
    expect(island.n).toBeLessThanOrEqual(8);
    // Sin islas pegadas.
    expect(p.islands.some((o) => Math.abs(o.r - island.r) + Math.abs(o.c - island.c) === 1)).toBe(false);
  }
  expect(isSolved(p.islands, p.edges, p.solution)).toBe(true);
  expect(countSolutions(p.islands, p.edges)).toBe(1);
  const rows = Array.from({ length: p.height }, (_, r) => Array.from({ length: p.width }, (_, c) => String(p.islands.find((i) => i.r === r && i.c === c)?.n ?? ".")).join(""));
  expect(bruteForceSolutions(rows)).toEqual([[...p.solution]]);
  const result = solve(p.islands, p.edges, cfg.maxTier);
  expect(result.solved).toBe(true);
  expect(result.bridges).toEqual([...p.solution]);
  expect(result.tier).toBeLessThanOrEqual(cfg.maxTier);
  expect(p.difficulty).toBe(result.steps + 3 * result.tier2Uses + 8 * result.tier3Uses + p.islands.length);
}

describe("tablero", () => {
  it("encuentra conexiones y detecta cruces", () => {
    const p = unpack({ w: 0, n: 0, t: 1, d: 0, g: ["2.2", "...", "2.2"], b: "1111" });
    expect(p.edges).toHaveLength(4);
    expect(isSolved(p.islands, p.edges, [1, 1, 1, 1])).toBe(true);
    expect(isSolved(p.islands, p.edges, [2, 0, 0, 2])).toBe(false);
    // Dos puentes dobles en paralelo dejan dos grupos sueltos: la única solución es el ciclo.
    expect(countSolutions(p.islands, p.edges)).toBe(1);
    expect(solve(p.islands, p.edges, 2).bridges).toEqual([1, 1, 1, 1]);
  });

  it("un tablero con dos soluciones no se resuelve sin adivinar", () => {
    const p = unpack({ w: 0, n: 0, t: 1, d: 0, g: ["3.3", "...", "3.3"], b: "2112" });
    expect(countSolutions(p.islands, p.edges)).toBe(2);
    expect(bruteForceSolutions(["3.3", "...", "3.3"])).toEqual([[1, 2, 2, 1], [2, 1, 1, 2]]);
    expect(solve(p.islands, p.edges, 3).solved).toBe(false);
  });
});

describe("generador", () => {
  it("es determinístico", () => {
    expect(generate("test:1", WORLDS[1])).toEqual(generate("test:1", WORLDS[1]));
  });

  for (const world of WORLDS) {
    it(`mundo ${world.id}: solución única y deducible`, () => {
      for (let i = 0; i < 3; i++) expectValid(generate(`test:w${world.id}:${i}`, world), world);
    });
  }

  it("diario: mismo tablero por fecha, único y deducible", () => {
    const start = Date.UTC(2026, 9, 31);
    for (let day = 0; day < 40; day++) {
      const date = new Date(start + day * 9 * 86_400_000).toISOString().slice(0, 10);
      const p = generateDaily(date);
      expectValid(p, DAILY_CONFIG);
      expect(generateDaily(date)).toEqual(p);
    }
  });
});

describe("niveles publicados", () => {
  it("contiene todos los mundos", () => {
    expect(packed).toHaveLength(WORLDS.reduce((total, world) => total + world.levels, 0));
    expect(WORLDS[0].unlockAfter).toBe(0);
  });

  for (const world of WORLDS) {
    it(`mundo ${world.id}: unicidad, técnica y curva`, () => {
      const levels = (packed as PackedLevel[]).filter((l) => l.w === world.id);
      expect(levels).toHaveLength(world.levels);
      let previous = -Infinity;
      for (const [i, level] of levels.entries()) {
        expect(level.n).toBe(i + 1);
        expect(level.d).toBeGreaterThanOrEqual(previous);
        const p = unpack(level);
        expect(p.edges).toEqual(findEdges(p.islands));
        expectValid(p, world);
        expect(solve(p.islands, p.edges, world.maxTier).tier).toBeGreaterThanOrEqual(world.minTier);
        expect(pack(world.id, i + 1, p)).toEqual(level);
        previous = level.d;
      }
    });
  }

  it("la dificultad sube entre mundos", () => {
    const median = (w: number) => {
      const ds = (packed as PackedLevel[]).filter((l) => l.w === w).map((l) => l.d);
      return ds[Math.floor(ds.length / 2)];
    };
    for (let i = 1; i < WORLDS.length; i++) expect(median(WORLDS[i].id)).toBeGreaterThan(median(WORLDS[i - 1].id));
  });

  it("la curva conserva extremos y no repite", () => {
    const base = unpack((packed as PackedLevel[])[0]);
    const pool = [10, 0, 9, 2, 8, 4, 6, 5].map((difficulty, i) => ({ ...base, id: String(i), difficulty }));
    const selected = selectDifficultyCurve(pool, 4);
    expect(selected[0].difficulty).toBe(0);
    expect(selected.at(-1)!.difficulty).toBe(10);
    expect(new Set(selected.map((p) => p.id)).size).toBe(4);
  });
});
