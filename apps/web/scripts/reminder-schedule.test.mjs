import test from "node:test";
import assert from "node:assert/strict";
import { nextReminder, offsetAt } from "../convex/schedule.ts";

const at = (iso) => Date.parse(iso);
test("the reminder fires at the chosen local time, today or tomorrow", () => {
  // Buenos Aires: UTC-3, sin horario de verano.
  assert.equal(nextReminder(at("2026-10-31T12:00:00Z"), 600, "America/Argentina/Buenos_Aires", -180), at("2026-10-31T13:00:00Z"));
  assert.equal(nextReminder(at("2026-10-31T13:00:00Z"), 600, "America/Argentina/Buenos_Aires", -180), at("2026-11-01T13:00:00Z"));
  // Cerca de medianoche UTC, la fecha local todavía es la anterior.
  assert.equal(nextReminder(at("2026-11-01T01:00:00Z"), 1380, "America/Argentina/Buenos_Aires", -180), at("2026-11-01T02:00:00Z"));
});
test("daylight saving changes keep the local time", () => {
  // Madrid pasa a UTC+1 el 25/10/2026.
  assert.equal(nextReminder(at("2026-10-24T09:00:00Z"), 600, "Europe/Madrid", 120), at("2026-10-25T09:00:00Z"));
  assert.equal(offsetAt(at("2026-10-24T09:00:00Z"), "Europe/Madrid", 0), 120);
});
test("an unknown time zone falls back to the saved offset", () => {
  assert.equal(offsetAt(0, "Nowhere/Invalid", -180), -180);
  assert.equal(nextReminder(at("2026-10-31T12:00:00Z"), 600, "Nowhere/Invalid", -180), at("2026-10-31T13:00:00Z"));
});
