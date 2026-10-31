/**
 * Pregenera los niveles de Palabra en levels/palabra.json.
 * Así quedan fijos aunque cambien el generador o las listas, y web y Expo cargan lo mismo.
 * Uso: pnpm --filter @cranea/core levels:palabra
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { boardStats, generatePalabraLevel, packPalabra, PALABRA_WORLDS, selectPalabraCurve, type PackedPalabraLevel, type PalabraPuzzle } from "../src/palabra";
import { loadDictionary } from "../src/palabra/words";

const dict = loadDictionary();
const used = new Set<string>();
const out: PackedPalabraLevel[] = [];
const t0 = Date.now();
for (const world of PALABRA_WORLDS) {
  const candidates: PalabraPuzzle[] = [];
  // Ninguna respuesta se repite entre niveles, ni dentro del mismo mundo ni entre mundos.
  const seen = new Set(used);
  for (let i = 1; candidates.length < world.levels * 3; i++) {
    let p = generatePalabraLevel(world, i, dict);
    for (let attempt = 1; seen.has(p.answer); attempt++) p = generatePalabraLevel(world, i, dict, attempt);
    seen.add(p.answer);
    candidates.push(p);
  }
  const selected = selectPalabraCurve(candidates, world.levels);
  for (const [i, p] of selected.entries()) {
    used.add(p.answer);
    out.push(packPalabra(world.id, i + 1, p));
  }
  const avg = (f: (p: PalabraPuzzle) => number) => (selected.reduce((sum, p) => sum + f(p), 0) / selected.length).toFixed(2);
  console.log(`Mundo ${world.id} "${world.name}": ${world.levels} niveles · filas ${avg((p) => p.clues.length)} · verdes ${avg((p) => boardStats(p.clues).greens)} · amarillas ${avg((p) => boardStats(p.clues).yellows)} · dificultad ${selected[0].difficulty}–${selected.at(-1)!.difficulty}`);
}
const file = fileURLToPath(new URL("../levels/palabra.json", import.meta.url));
writeFileSync(file, JSON.stringify(out));
console.log(`${out.length} niveles en ${((Date.now() - t0) / 1000).toFixed(1)}s → levels/palabra.json`);
