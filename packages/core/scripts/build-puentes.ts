/**
 * Pregenera todos los niveles de Puentes en levels/puentes.json.
 * Así los niveles quedan fijos aunque cambies el generador, y web y Expo cargan lo mismo.
 * Uso: pnpm --filter @cranea/core levels:puentes
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { WORLDS, generateLevel, pack, selectDifficultyCurve, type PackedLevel } from "../src/puentes";

const out: PackedLevel[] = [];
const t0 = Date.now();
// Cada mundo arranca, como mínimo, en la mediana del anterior: la dificultad sube entre mundos.
let floor = 0;
for (const world of WORLDS) {
  const tiers = [0, 0, 0, 0];
  const all = Array.from({ length: world.levels * 4 }, (_, i) => generateLevel(world, i + 1));
  const above = all.filter((p) => p.difficulty >= floor);
  const candidates = above.length >= world.levels * 2 ? above : all;
  const selected = selectDifficultyCurve(candidates, world.levels);
  floor = selected[Math.floor(selected.length / 2)].difficulty;
  for (const [i, p] of selected.entries()) {
    tiers[p.tier]++;
    out.push(pack(world.id, i + 1, p));
  }
  const islands = selected.reduce((sum, p) => sum + p.islands.length, 0) / selected.length;
  console.log(`Mundo ${world.id} "${world.name}": ${world.levels} niveles · técnicas ${tiers.slice(1).join("/")} · islas promedio ${islands.toFixed(1)} · difficulty ${selected[0].difficulty}–${selected.at(-1)!.difficulty}`);
}
const file = fileURLToPath(new URL("../levels/puentes.json", import.meta.url));
writeFileSync(file, JSON.stringify(out));
console.log(`${out.length} niveles en ${((Date.now() - t0) / 1000).toFixed(1)}s → levels/puentes.json`);
