import { describe, expect, it } from "vitest";
import { generateDaily, solve, traceSolve, unpack, type CifraPuzzle, type Clue, type PackedLevel, type Trace } from "./index";
import packed from "../../levels/cifra.json";
import { cifraStepText } from "../i18n";

const es = (step: Trace["steps"][number]) => cifraStepText(step, "es");

const clue = (guess: string, exact: number, present: number): Clue => ({ guess: guess.split("").map(Number), feedback: { exact, present } });

/** Cada hecho anotado tiene que ser cierto para la solución. */
function expectTruthful(trace: Trace, p: CifraPuzzle) {
  expect(trace.solved).toBe(true);
  expect(trace.solution).toEqual(p.solution);
  expect(trace.steps.length).toBeGreaterThan(0);
  for (const step of trace.steps) {
    const { out, in: inn, fixed, removed } = step.facts;
    expect(out.length + inn.length + fixed.length + removed.length, es(step).text).toBeGreaterThan(0);
    expect(es(step).text.length).toBeGreaterThan(es(step).reason.length);
    expect(cifraStepText(step, "en").text.length).toBeGreaterThan(cifraStepText(step, "en").reason.length);
    for (const d of out) expect(p.solution).not.toContain(d);
    for (const d of inn) expect(p.solution).toContain(d);
    for (const [pos, d] of fixed) expect(p.solution[pos]).toBe(d);
    for (const [pos, d] of removed) expect(p.solution[pos]).not.toBe(d);
    for (const r of step.rows) expect(r).toBeLessThan(p.clues.length);
    if (step.tier < 3) expect(step.rows).toHaveLength(1);
  }
}

describe("traza del solver", () => {
  it("explica cada paso en palabras", () => {
    const clues = [clue("1234", 0, 0), clue("5678", 1, 3), clue("5690", 2, 0), clue("8756", 0, 4), clue("6875", 0, 4)];
    const trace = traceSolve(clues, 4);
    expect(trace.steps[0]).toMatchObject({ rows: [0], tier: 1, reason: { kind: "none", row: 1 } });
    expect(es(trace.steps[0]).reason).toBe("La fila 1 no tiene ninguna cifra del código");
    expect(cifraStepText(trace.steps[0], "en").text).toBe("Row 1 has none of the code's digits: 1, 2, 3 and 4 are out.");
    expect(es(trace.steps[0]).text).toBe("La fila 1 no tiene ninguna cifra del código: el 1, el 2, el 3 y el 4 no están.");
    expect(es(trace.steps[1]).reason).toBe("Todas las cifras de la fila 2 están en el código");
    expect(es(trace.steps[1]).text).toContain("Con eso, el 0 y el 9 no están");
  });

  it("resuelve todos los niveles publicados con la técnica de su mundo", () => {
    for (const level of packed as PackedLevel[]) {
      const p = unpack(level);
      const trace = traceSolve(p.clues, p.length);
      expectTruthful(trace, p);
      expect(Math.max(...trace.steps.map((s) => s.tier))).toBe(solve(p.clues, p.length).tier);
    }
  }, 120_000);

  it("resuelve diarios y señala las filas de una suposición", () => {
    let hypotheses = 0;
    for (const date of ["2026-10-22", "2026-10-23", "2026-10-24", "2026-11-05", "2027-01-01"]) {
      const p = generateDaily(date);
      const trace = traceSolve(p.clues, p.length);
      expectTruthful(trace, p);
      for (const step of trace.steps.filter((s) => s.tier === 3)) {
        hypotheses++;
        expect(es(step).reason).toMatch(/^Si el \d fuera en el lugar \d/);
        expect(step.rows.length).toBeGreaterThan(0);
      }
    }
    const tier3 = (packed as PackedLevel[]).filter((l) => l.t === 3).slice(0, 5).map(unpack);
    for (const p of tier3) hypotheses += traceSolve(p.clues, p.length).steps.filter((s) => s.tier === 3).length;
    expect(hypotheses).toBeGreaterThan(0);
  }, 120_000);

  it("no inventa una solución si las pistas no alcanzan", () => {
    expect(traceSolve([clue("1234", 0, 0)], 4).solved).toBe(false);
  });
});
