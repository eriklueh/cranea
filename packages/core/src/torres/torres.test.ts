import { describe, expect, it } from "vitest";
import {
  candidateConfig,
  clueState,
  cluesFor,
  countClues,
  countSolutions,
  DAILY_CONFIG,
  difficultyOf,
  duplicateCells,
  generate,
  generateDaily,
  isSolved,
  maxGivens,
  minClues,
  pack,
  solve,
  unpack,
  visibleCount,
  WORLDS,
  type PackedLevel,
  type TorresConfig,
  type TorresPuzzle,
} from "./index";
import packed from "../../levels/torres.json";

/**
 * Conteo independiente del solver: búsqueda casilla por casilla que solo usa las reglas
 * (sin repetir en fila/columna, casillas dadas y lo visible desde cada borde).
 */
function bruteCount(p: Pick<TorresPuzzle, "size" | "clues" | "givens">, limit = 2): number {
  const n = p.size;
  const g = p.givens.slice();
  const views: [number[], number][] = [];
  for (let i = 0; i < n; i++) {
    const row = Array.from({ length: n }, (_, k) => i * n + k);
    const col = Array.from({ length: n }, (_, k) => k * n + i);
    views.push([row, p.clues.left[i]], [[...row].reverse(), p.clues.right[i]], [col, p.clues.top[i]], [[...col].reverse(), p.clues.bottom[i]]);
  }
  const viewsOf = Array.from({ length: n * n }, (_, cell) => views.filter(([cells, clue]) => clue && cells.includes(cell)));
  // Lo visible desde el borde hasta el primer vacío no puede pasarse ni quedarse corto sin remedio.
  const viewOk = ([cells, clue]: [number[], number]) => {
    let max = 0;
    let k = 0;
    let len = 0;
    for (const c of cells) {
      if (!g[c]) break;
      len++;
      if (g[c] > max) { max = g[c]; k++; }
    }
    if (len === n) return k === clue;
    return k <= clue && k + Math.min(n - max, n - len) >= clue;
  };
  const legal = (cell: number): number[] => {
    const r = Math.floor(cell / n);
    const c = cell % n;
    const out: number[] = [];
    for (let v = 1; v <= n; v++) {
      let ok = true;
      for (let k = 0; k < n && ok; k++) ok = g[r * n + k] !== v && g[k * n + c] !== v;
      if (!ok) continue;
      g[cell] = v;
      if (viewsOf[cell].every(viewOk)) out.push(v);
      g[cell] = 0;
    }
    return out;
  };
  for (let i = 0; i < n * n; i++) if (g[i] && !viewsOf[i].every(viewOk)) return 0;
  let count = 0;
  const rec = () => {
    let best = -1;
    let bestVals: number[] = [];
    for (let i = 0; i < n * n; i++) {
      if (g[i]) continue;
      const vals = legal(i);
      if (!vals.length) return;
      if (best < 0 || vals.length < bestVals.length) {
        best = i;
        bestVals = vals;
        if (vals.length === 1) break;
      }
    }
    if (best < 0) { count++; return; }
    for (const v of bestVals) {
      g[best] = v;
      rec();
      g[best] = 0;
      if (count >= limit) return;
    }
  };
  rec();
  return count;
}

function expectValid(p: TorresPuzzle, cfg: TorresConfig) {
  const n = p.size;
  expect(n).toBe(cfg.size);
  expect(p.solution).toHaveLength(n * n);
  expect(p.givens).toHaveLength(n * n);
  expect(isSolved(p.solution, n, cluesFor(p.solution, n), [])).toBe(true);
  // Toda pista publicada coincide con la solución; las dadas también.
  const full = cluesFor(p.solution, n);
  for (const side of ["top", "bottom", "left", "right"] as const) {
    expect(p.clues[side]).toHaveLength(n);
    p.clues[side].forEach((clue, i) => clue && expect(clue).toBe(full[side][i]));
  }
  p.givens.forEach((g, i) => g && expect(g).toBe(p.solution[i]));
  expect(p.givens.filter(Boolean).length, "pocas casillas dadas").toBeLessThanOrEqual(maxGivens(n));
  expect(countClues(p.clues), "suficientes pistas de borde").toBeGreaterThanOrEqual(minClues(n));

  expect(bruteCount(p), "solución única (conteo independiente)").toBe(1);
  expect(countSolutions(p)).toBe(1);
  const res = solve(p, cfg.maxTier);
  expect(res.solved, "deducible sin adivinar").toBe(true);
  expect(res.grid).toEqual(p.solution);
  expect(res.tier).toBeLessThanOrEqual(cfg.maxTier);
  expect(res.tier).toBe(p.tier);
  expect(p.difficulty).toBe(difficultyOf(res));
}

describe("reglas", () => {
  it("cuenta torres visibles", () => {
    expect(visibleCount([1, 2, 3, 4])).toBe(4);
    expect(visibleCount([4, 3, 2, 1])).toBe(1);
    expect(visibleCount([2, 1, 4, 3])).toBe(2);
    expect(visibleCount([3, 0, 4])).toBe(2);
  });

  it("calcula las pistas de los cuatro lados", () => {
    const sol = [1, 2, 3, 2, 3, 1, 3, 1, 2];
    expect(cluesFor(sol, 3)).toEqual({ top: [3, 2, 1], bottom: [1, 2, 2], left: [3, 2, 1], right: [1, 2, 2] });
  });

  it("pistas: pendiente, cumplida o en conflicto", () => {
    const v = [2, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(clueState(v, 3, "left", 0, 2)).toBe("pending");
    expect(clueState([2, 3, 1, 0, 0, 0, 0, 0, 0], 3, "left", 0, 2)).toBe("ok");
    expect(clueState([3, 0, 0, 0, 0, 0, 0, 0, 0], 3, "left", 0, 2)).toBe("conflict");
    expect(clueState([1, 2, 0, 0, 0, 0, 0, 0, 0], 3, "left", 0, 1)).toBe("conflict");
    expect(clueState([1, 2, 3, 0, 0, 0, 0, 0, 0], 3, "right", 0, 1)).toBe("ok");
    expect(clueState(v, 3, "left", 0, 0)).toBe("none");
  });

  it("marca repetidos en fila y columna", () => {
    expect([...duplicateCells([1, 1, 0, 0, 0, 0, 1, 0, 2], 3)].sort()).toEqual([0, 1, 6]);
  });
});

describe("generador", () => {
  it("es determinístico", () => {
    expect(generate("test:1", DAILY_CONFIG)).toEqual(generate("test:1", DAILY_CONFIG));
  });

  for (const world of WORLDS.slice(0, 3)) {
    it(`mundo ${world.id}: solución única y deducible`, () => {
      for (let i = 0; i < 4; i++) {
        const cfg = candidateConfig(world, i);
        expectValid(generate(`test:w${world.id}:${i}`, cfg), cfg);
      }
    });
  }

  it("diarios: únicos, deducibles y iguales para todos", () => {
    for (const date of ["2026-10-31", "2026-11-01", "2026-12-31", "2027-01-01", "2027-06-15", "2028-02-29", "2030-03-03"]) {
      const p = generateDaily(date);
      expectValid(p, DAILY_CONFIG);
      expect(p.tier).toBeGreaterThanOrEqual(DAILY_CONFIG.minTier);
      expect(generateDaily(date)).toEqual(p);
    }
  });
});

describe("niveles publicados", () => {
  it("cubre los mundos en orden de tamaño", () => {
    expect(WORLDS.map((w) => w.size)).toEqual([4, 5, 6, 7]);
    expect(WORLDS[0].unlockAfter).toBe(0);
    expect(packed).toHaveLength(WORLDS.reduce((total, w) => total + w.levels, 0));
  });

  for (const world of WORLDS) {
    it(`mundo ${world.id}: unicidad, deducción, técnica y curva`, () => {
      const levels = (packed as PackedLevel[]).filter((l) => l.w === world.id);
      expect(levels).toHaveLength(world.levels);
      let previous = -Infinity;
      for (const [i, level] of levels.entries()) {
        expect(level.n).toBe(i + 1);
        expect(level.d).toBeGreaterThanOrEqual(previous);
        expect(level.t).toBeGreaterThanOrEqual(world.minTier);
        const p = unpack(level);
        expectValid(p, world);
        expect(pack(world.id, i + 1, p)).toEqual(level);
        previous = level.d;
      }
    }, 300_000);
  }

  it("la dificultad sube entre mundos", () => {
    const max = (w: number) => Math.max(...(packed as PackedLevel[]).filter((l) => l.w === w).map((l) => l.d));
    for (let i = 1; i < WORLDS.length; i++) expect(max(WORLDS[i].id)).toBeGreaterThan(max(WORLDS[i - 1].id));
  });
});
