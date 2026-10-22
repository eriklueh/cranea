import { readFileSync, writeFileSync } from "node:fs";
import { WORLDS, solve, unpack, type PackedLevel } from "../src/cifra";

// Recalcula ambos conjuntos con las mismas reglas y el mismo orden de pistas.
const root = new URL("../../../artifacts/cifra/", import.meta.url);
const before: PackedLevel[] = JSON.parse(readFileSync(new URL("before.json", root), "utf8"));
const after: PackedLevel[] = JSON.parse(readFileSync(new URL("../levels/cifra.json", import.meta.url), "utf8"));
function summarize(levels: PackedLevel[]) {
  return WORLDS.map((world) => {
    const group = levels.filter((l) => l.w === world.id);
    const difficulty = group.map((l) => {
      const p = unpack(l);
      const r = solve(p.clues, p.length, world.maxTier);
      return r.steps + 3 * r.tier2Uses + 8 * r.tier3Uses + p.clues.length;
    });
    return {
      world: world.id, name: world.name,
      averageRows: group.reduce((s, l) => s + l.c.length, 0) / group.length,
      minRows: Math.min(...group.map((l) => l.c.length)), maxRows: Math.max(...group.map((l) => l.c.length)),
      averageZeroRows: group.reduce((s, l) => s + l.c.filter(([, e, p]) => e + p === 0).length, 0) / group.length,
      minDifficulty: Math.min(...difficulty), maxDifficulty: Math.max(...difficulty),
      maxJump: Math.max(...difficulty.slice(1).map((d, i) => Math.abs(d - difficulty[i]))),
    };
  });
}
const report = { before: summarize(before), after: summarize(after) };
writeFileSync(new URL("balance.json", root), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
