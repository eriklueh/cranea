/**
 * Pregenera los niveles de Palabra en levels/palabra.json (una respuesta por nivel, sin repetir).
 * Así quedan fijos aunque cambien las listas, y web y Expo cargan lo mismo.
 * Uso: pnpm --filter @cranea/core levels:palabra
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generatePalabraLevel, packPalabra, PALABRA_WORLDS, type PackedPalabraLevel } from "../src/palabra";
import { loadDictionary } from "../src/palabra/words";

const dict = loadDictionary();
const used = new Set<string>();
const out: PackedPalabraLevel[] = [];
for (const world of PALABRA_WORLDS) {
  for (let n = 1; n <= world.levels; n++) {
    const p = generatePalabraLevel(world, n, dict, used);
    used.add(p.answer);
    out.push(packPalabra(world.id, n, p));
  }
}
const file = fileURLToPath(new URL("../levels/palabra.json", import.meta.url));
writeFileSync(file, JSON.stringify(out));
console.log(`${out.length} niveles → levels/palabra.json`);
