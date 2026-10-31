/**
 * Pregenera todos los niveles de Torres en levels/torres.json.
 * Uso: pnpm --filter @cranea/core levels:torres
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { WORLDS, generateCandidate, pack, selectDifficultyCurve, type PackedLevel } from "../src/torres";

const out: PackedLevel[] = [];
const t0 = Date.now();
for (const world of WORLDS) {
  const tiers = [0, 0, 0, 0];
  const candidates = Array.from({ length: world.levels * 3 }, (_, i) => generateCandidate(world, i + 1));
  const selected = selectDifficultyCurve(candidates, world.levels);
  for (const [i, p] of selected.entries()) {
    tiers[p.tier]++;
    out.push(pack(world.id, i + 1, p));
  }
  const givens = selected.reduce((sum, p) => sum + p.givens.filter(Boolean).length, 0) / selected.length;
  console.log(`Mundo ${world.id} "${world.name}": ${world.levels} niveles · técnicas ${tiers.slice(1).join("/")} · dadas promedio ${givens.toFixed(1)} · difficulty ${selected[0].difficulty}–${selected.at(-1)!.difficulty}`);
}
const file = fileURLToPath(new URL("../levels/torres.json", import.meta.url));
writeFileSync(file, JSON.stringify(out));
console.log(`${out.length} niveles en ${((Date.now() - t0) / 1000).toFixed(1)}s → levels/torres.json`);
