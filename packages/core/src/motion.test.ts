import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cssEasing, DURATION, EASING, HOP_MS, STAGGER, staggerStep } from "./motion";

describe("motion", () => {
  it("el escalonado nunca pasa del tope", () => {
    for (const count of [1, 2, 4, 5, 7, 11, 21]) {
      for (const item of [DURATION.fast, DURATION.base, DURATION.slow, HOP_MS]) {
        const step = staggerStep(count, item);
        expect(step).toBeLessThanOrEqual(STAGGER.step);
        expect(step * (count - 1) + item).toBeLessThanOrEqual(STAGGER.max);
      }
    }
    expect(staggerStep(1)).toBe(0);
  });

  it("la web usa los mismos tokens (globals.css)", () => {
    const css = readFileSync(fileURLToPath(new URL("../../../apps/web/src/app/globals.css", import.meta.url)), "utf8");
    for (const [name, ms] of Object.entries(DURATION)) expect(css).toContain(`--dur-${name}: ${ms}ms;`);
    expect(css).toContain(`--ease-out: ${cssEasing(EASING.out)};`);
    expect(css).toContain(`--ease-in: ${cssEasing(EASING.in)};`);
  });
});
