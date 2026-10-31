import { tileMarkState, traceSolve, type CifraPuzzle, type Clue, type Marks, type Trace, type TraceStep } from "@cranea/core/cifra";

/** Copia de apps/web/src/games/cifra/hints.ts: pistas a partir de la traza del solver humano (@cranea/core). */

const traces = new Map<string, { puzzle: CifraPuzzle; trace: Trace }>();

/** Traza del solver humano para un tablero, calculada una sola vez. */
export function traceFor(puzzle: CifraPuzzle): Trace {
  const hit = traces.get(puzzle.id);
  if (hit?.puzzle === puzzle) return hit.trace;
  const trace = traceSolve(puzzle.clues, puzzle.length);
  traces.set(puzzle.id, { puzzle, trace });
  return trace;
}

/** ¿Las marcas del jugador ya muestran todo lo que deduce este paso? */
function shown(step: TraceStep, rows: readonly Clue[], marks: Marks) {
  const tiles = rows.flatMap((c, r) => c.guess.map((d, p) => ({ d, p, mark: tileMarkState(marks, r, p) })));
  const has = (f: (t: (typeof tiles)[number]) => boolean) => tiles.some(f);
  const out = (d: number) => has((t) => t.d === d && t.mark === "out");
  const here = (p: number, d: number) => has((t) => t.d === d && t.p === p && t.mark === "here");
  const { facts } = step;
  return (
    facts.out.every(out) &&
    facts.in.every((d) => has((t) => t.d === d && (t.mark === "in" || t.mark === "here"))) &&
    facts.fixed.every(([p, d]) => here(p, d)) &&
    facts.removed.every(([p, d]) => out(d) || has((t) => t.d === d && t.p !== p && t.mark === "here") || has((t) => t.d === d && t.p === p && t.mark === "out"))
  );
}

/** Primer paso que tus marcas todavía no muestran; -1 si ya está todo deducido. */
export function nextHintStep(puzzle: CifraPuzzle, misses: readonly Clue[], marks: Marks): number {
  const rows = [...puzzle.clues, ...misses];
  return traceFor(puzzle).steps.findIndex((step) => !shown(step, rows, marks));
}

const rowList = (rows: number[]) => {
  const n = rows.map((r) => String(r + 1));
  return n.length < 2 ? `la fila ${n[0]}` : `las filas ${n.slice(0, -1).join(", ")} y ${n.at(-1)}`;
};

/** Primer nivel de la pista: dónde mirar, sin decir qué sale. */
export function hintNudge(step: TraceStep) {
  if (step.tier === 3) return step.rows.length ? `Suponé una cifra en un lugar y cruzala con ${rowList(step.rows)}.` : "Suponé una cifra en un lugar y mirá si todo cierra.";
  if (step.tier === 2) return `Cruzá ${rowList(step.rows)} con lo que ya sabés.`;
  return `Mirá ${rowList(step.rows)}: se lee sola.`;
}
