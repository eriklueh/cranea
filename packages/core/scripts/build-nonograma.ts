/**
 * Pregenera los niveles de Nonograma en levels/nonograma.json.
 * Ordena los dibujos de cada mundo por dificultad (medida por el solver de líneas) y los deja fijos.
 * Uso: pnpm --filter @cranea/core levels:nonograma
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { WORLDS, countSolutions, orderWorld, pack, type PackedLevel } from "../src/nonograma";

const out: PackedLevel[] = [];
for (const world of WORLDS) {
  const ordered = orderWorld(world);
  for (const [i, p] of ordered.entries()) {
    if (countSolutions(p.rows, p.cols, 2) !== 1) throw new Error(`"${p.title}" tiene más de una solución`);
    out.push(pack(world.id, i + 1, p));
  }
  console.log(`Mundo ${world.id} "${world.name}": ${ordered.length} dibujos · dificultad ${ordered[0].difficulty}–${ordered.at(-1)!.difficulty}`);
  console.log(`  ${ordered.map((p) => p.title).join(", ")}`);
}
const file = fileURLToPath(new URL("../levels/nonograma.json", import.meta.url));
writeFileSync(file, JSON.stringify(out) + "\n");
console.log(`${out.length} niveles → levels/nonograma.json`);
