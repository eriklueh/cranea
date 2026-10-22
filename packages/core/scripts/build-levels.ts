/**
 * Pregenera todos los niveles de Cifra en levels/cifra.json.
 * Así los niveles quedan fijos aunque cambies el generador, y web y Expo cargan lo mismo.
 * Uso: pnpm levels
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { WORLDS, generateLevel, pack, selectDifficultyCurve, type PackedLevel } from "../src/cifra";

const out: PackedLevel[] = [];
const t0 = Date.now();
for (const world of WORLDS) {
  const tiers = [0, 0, 0, 0];
  const candidates = Array.from({ length: world.levels * 3 }, (_, i) => generateLevel(world, i + 1));
  const selected = selectDifficultyCurve(candidates, world.levels);
  for (const [i, p] of selected.entries()) {
    tiers[p.tier]++;
    out.push(pack(world.id, i + 1, p));
  }
  const averageRows = selected.reduce((sum, p) => sum + p.clues.length, 0) / selected.length;
  const averageZeros = selected.reduce((sum, p) => sum + p.clues.filter((c) => c.feedback.exact + c.feedback.present === 0).length, 0) / selected.length;
  console.log(`  Filas promedio: ${averageRows.toFixed(2)} · ceros promedio: ${averageZeros.toFixed(2)} · difficulty: ${selected[0].difficulty}–${selected.at(-1)!.difficulty}`);
  console.log(`Mundo ${world.id} "${world.name}": ${world.levels} niveles · técnicas ${tiers.slice(1).join("/")}`);
}
const file = fileURLToPath(new URL("../levels/cifra.json", import.meta.url));
writeFileSync(file, JSON.stringify(out));
console.log(`${out.length} niveles en ${((Date.now() - t0) / 1000).toFixed(1)}s → levels/cifra.json`);
