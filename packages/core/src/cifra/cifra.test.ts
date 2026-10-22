import { describe, expect, it } from "vitest";
import { candidates, DAILY_CONFIG, generate, generateDaily, pack, score, selectDifficultyCurve, solve, unpack, WORLDS, type CifraConfig, type CifraPuzzle, type PackedLevel } from "./index";
import packed from "../../levels/cifra.json";

function expectBalanced(p: CifraPuzzle, cfg: CifraConfig) {
  expect(p.clues.length).toBeGreaterThanOrEqual(cfg.minRows);
  expect(p.clues.length).toBeLessThanOrEqual(cfg.maxRows);
  const zeros = p.clues.filter((c) => c.feedback.exact + c.feedback.present === 0);
  const eliminated = new Set(zeros.flatMap((c) => [...c.guess])).size;
  expect(zeros.length).toBeLessThanOrEqual(cfg.maxZeroRows);
  expect(eliminated).toBeLessThanOrEqual(cfg.maxDirectEliminations);
  expect(10 - eliminated).toBeGreaterThan(p.length);
  if (p.length >= 4) {
    expect(p.clues.some((c) => c.feedback.exact >= 1)).toBe(true);
    expect(p.clues.some((c) => c.feedback.present >= 1)).toBe(true);
  }
  expect(candidates(p.clues, p.length)).toEqual([p.solution]);
  const result = solve(p.clues, p.length, cfg.maxTier);
  expect(result.solved).toBe(true);
  expect(result.solution).toEqual(p.solution);
  expect(result.tier).toBeLessThanOrEqual(cfg.maxTier);
  expect(p.difficulty).toBe(result.steps + 3 * result.tier2Uses + 8 * result.tier3Uses + p.clues.length);
}

describe("score", () => {
  it("cuenta exactos y presentes", () => {
    expect(score([1, 2, 3, 4], [1, 3, 2, 9])).toEqual({ exact: 1, present: 2 });
    expect(score([1, 2, 3, 4], [5, 6, 7, 8])).toEqual({ exact: 0, present: 0 });
  });
});

describe("generador", () => {
  it("es determinístico", () => {
    const a = generate("test:1", WORLDS[1]);
    const b = generate("test:1", WORLDS[1]);
    expect(a).toEqual(b);
  });

  for (const world of WORLDS) {
    it(`mundo ${world.id}: solución única y deducible`, () => {
      for (let i = 0; i < 4; i++) {
        const p = generate(`test:w${world.id}:${i}`, world);
        expectBalanced(p, world);
      }
    }, 120_000);
  }

  it("diario", () => {
    for (const date of ["2026-10-22", "2026-10-23", "2026-12-31", "2027-01-01", "2028-02-29"]) {
      const p = generateDaily(date);
      expectBalanced(p, DAILY_CONFIG);
      expect(generateDaily(date)).toEqual(p);
    }
  }, 120_000);
});

describe("niveles publicados", () => {
  it("empieza en cuatro cifras y solo publica mundos activos", () => {
    expect(WORLDS[0].length).toBe(4);
    expect(WORLDS[0].unlockAfter).toBe(0);
    expect(WORLDS.map((world) => world.id)).toEqual([2, 3, 4, 5]);
    expect(packed).toHaveLength(WORLDS.reduce((total, world) => total + world.levels, 0));
    expect(packed.every((level) => WORLDS.some((world) => world.id === level.w))).toBe(true);
  });
  for (const world of WORLDS) {
    it(`mundo ${world.id}: balance, unicidad, técnica y curva`, () => {
      const levels = (packed as PackedLevel[]).filter((l) => l.w === world.id);
      expect(levels).toHaveLength(world.levels);
      let previous = -Infinity;
      for (const [i, level] of levels.entries()) {
        expect(level.n).toBe(i + 1);
        expect(level.d).toBeGreaterThanOrEqual(previous);
        const p = unpack(level);
        expectBalanced(p, world);
        expect(pack(world.id, i + 1, p)).toEqual(level);
        previous = level.d;
      }
    }, 120_000);
  }
});

describe("métrica y curva", () => {
  it("cuenta solamente deducciones productivas del nivel correspondiente", () => {
    for (const world of WORLDS) {
      const level = (packed as PackedLevel[]).find((l) => l.w === world.id)!;
      const p = unpack(level);
      const r = solve(p.clues, p.length, world.maxTier);
      expect(r.tier2Uses + r.tier3Uses).toBeLessThanOrEqual(r.steps);
      if (r.tier === 1) expect(r.tier2Uses + r.tier3Uses).toBe(0);
      if (r.tier === 2) { expect(r.tier2Uses).toBeGreaterThan(0); expect(r.tier3Uses).toBe(0); }
      if (r.tier === 3) expect(r.tier3Uses).toBeGreaterThan(0);
      const capped = solve(p.clues, p.length, 1);
      expect(capped.tier2Uses + capped.tier3Uses).toBe(0);
    }
  });

  it("conserva extremos, no repite y distribuye objetivos de dificultad", () => {
    const base = unpack((packed as PackedLevel[])[0]);
    const pool = [10, 0, 9, 2, 8, 4, 6, 5].map((difficulty, i) => ({ ...base, id: String(i), difficulty }));
    const selected = selectDifficultyCurve(pool, 4);
    expect(selected[0].difficulty).toBe(0);
    expect(selected.at(-1)!.difficulty).toBe(10);
    expect(selected.slice(1).reduce((sum, p, i) => sum + (p.difficulty - selected[i].difficulty) ** 2, 0)).toBe(36);
    expect(new Set(selected.map((p) => p.id)).size).toBe(4);
    expect(selectDifficultyCurve(pool, 4)).toEqual(selected);
    expect(selectDifficultyCurve(pool.map((p) => ({ ...p, difficulty: 1 })), 4)).toHaveLength(4);
  });

  it("respeta límites de descartes más estrictos que los de los mundos", () => {
    const config = { ...WORLDS[1], maxZeroRows: 0, maxDirectEliminations: 0 };
    expectBalanced(generate("test:no-zero-rows", config), config);
  }, 120_000);
});
