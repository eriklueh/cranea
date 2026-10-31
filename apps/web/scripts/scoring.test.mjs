import assert from "node:assert/strict";
import test from "node:test";
import {
  attemptPoints, dailyPoints, monthKey, orderKey, periodKey, periodRange, shiftPeriod, timePoints, totals, weekKey,
} from "../convex/scoring.ts";

test("un diario vale entre 2 (jugado) y 20 puntos", () => {
  assert.equal(dailyPoints("cifra", { won: false, attempts: 3, timeMs: 30_000 }), 2);
  assert.equal(dailyPoints("cifra", { won: true, attempts: 1, timeMs: 60_000 }), 20);
  assert.equal(dailyPoints("palabra", { won: true, attempts: 6, timeMs: 10 * 60_000 }), 10);
});

test("los intentos bajan parejo hasta el máximo de cada juego", () => {
  assert.deepEqual([1, 2, 3].map((n) => attemptPoints("cifra", n)), [5, 3, 0]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => attemptPoints("palabra", n)), [5, 4, 3, 2, 1, 0]);
  // Puentes no tiene tope de errores: de 4 intentos en adelante, 0.
  assert.deepEqual([1, 2, 3, 4, 9].map((n) => attemptPoints("puentes", n)), [5, 3, 2, 0, 0]);
});

test("el tiempo da 5 hasta la referencia y 0 desde cuatro veces la referencia", () => {
  assert.equal(timePoints("palabra", 90_000), 5);
  assert.equal(timePoints("palabra", 120_000), 5);
  assert.equal(timePoints("palabra", 300_000), 3);
  assert.equal(timePoints("palabra", 480_000), 0);
  assert.equal(timePoints("palabra", 3_600_000), 0);
});

test("semanas ISO (lunes a domingo, UTC)", () => {
  assert.equal(weekKey("2026-10-26"), "2026-W44"); // lunes
  assert.equal(weekKey("2026-11-01"), "2026-W44"); // domingo
  assert.equal(weekKey("2026-11-02"), "2026-W45");
  assert.equal(weekKey("2027-01-01"), "2026-W53"); // viernes: todavía es del año ISO anterior
  assert.equal(weekKey("2027-01-04"), "2027-W01");
  assert.equal(weekKey("2025-12-29"), "2026-W01");
  assert.equal(monthKey("2026-10-31"), "2026-10");
  assert.equal(periodKey("day", "2026-10-31"), "2026-10-31");
});

test("rangos y saltos de período", () => {
  assert.deepEqual(periodRange("week", "2026-10-31"), { from: "2026-10-26", to: "2026-11-01" });
  assert.deepEqual(periodRange("month", "2026-02-10"), { from: "2026-02-01", to: "2026-02-28" });
  assert.equal(shiftPeriod("week", "2026-10-31", -1), "2026-10-24");
  assert.equal(shiftPeriod("month", "2026-03-31", -1), "2026-02-01");
  assert.equal(shiftPeriod("day", "2026-12-31", 1), "2027-01-01");
});

test("el orden prioriza puntos, después resueltos, después menos tiempo", () => {
  const a = totals([{ gameId: "cifra", won: true, attempts: 1, timeMs: 60_000 }]);
  assert.deepEqual(a, { points: 20, wins: 1, played: 1, timeMs: 60_000 });
  const key = (points, wins, timeMs) => orderKey({ points, wins, played: wins, timeMs });
  assert.ok(key(21, 0, 0) > key(20, 5, 0));
  assert.ok(key(20, 2, 999_000) > key(20, 1, 0));
  assert.ok(key(20, 2, 60_000) > key(20, 2, 61_000));
  assert.ok(Number.isSafeInteger(key(3100, 155, 155 * 86_400_000)));
});
