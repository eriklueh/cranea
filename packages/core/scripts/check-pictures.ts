/** Herramienta de autor: dice qué dibujos no salen por lógica de líneas y sugiere casillas para cambiar. */
import { PICTURES_5, PICTURES_10, PICTURES_15 } from "../src/nonograma/pictures";
import { cluesFor, parsePicture, pictureToRows } from "../src/nonograma/clues";
import { countSolutions } from "../src/nonograma/count";
import { difficultyOf, solve } from "../src/nonograma/solver";

const check = (rowsIn: readonly string[]) => {
  const { width, height, solution } = parsePicture(rowsIn);
  const { rows, cols } = cluesFor(solution, width, height);
  return { r: solve(rows, cols), rows, cols, width, height, solution };
};

for (const [label, list] of [["5", PICTURES_5], ["10", PICTURES_10], ["15", PICTURES_15]] as const) {
  for (const p of list) {
    const { r, rows, cols, width, height, solution } = check(p.rows);
    const t = Date.now();
    const count = countSolutions(rows, cols, 2);
    const unknown = r.grid.filter((v) => v === 0).length;
    console.log(`${label} ${p.title.padEnd(10)} ${r.solved ? "ok" : "NO"} unknown=${unknown} d=${difficultyOf(r, width, height)} sweeps=${r.sweeps} sols=${count} (${Date.now() - t}ms)`);
    if (r.solved) continue;
    const fixes: string[] = [];
    for (let i = 0; i < solution.length; i++) {
      const s = solution.slice();
      s[i] = !s[i];
      if (check(pictureToRows(s, width)).r.solved) fixes.push(`(${Math.floor(i / width)},${i % width})`);
    }
    console.log(`   fixes: ${fixes.join(" ") || "none"}`);
    console.log(pictureToRows(solution, width).map((row, ri) => "   " + [...row].map((ch, ci) => (r.grid[ri * width + ci] === 0 ? "?" : ch)).join("")).join("\n"));
  }
}
