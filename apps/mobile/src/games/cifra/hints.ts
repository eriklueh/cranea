import { tileMarkState, traceSolve, type CifraPuzzle, type Clue, type Marks, type Trace, type TraceStep } from "@cranea/core/cifra";
import { list, type Locale } from "@cranea/core/i18n";
import type { T } from "@/lib/i18n";

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

/** "la fila 2", "las filas 1, 2 y 3" / "row 2", "rows 1, 2 and 3". */
const rowList = (rows: number[], t: T, locale: Locale) =>
  t("cifra.rows", { count: rows.length, rows: list(rows.map((r) => String(r + 1)), locale) });

/** Primer nivel de la pista: dónde mirar, sin decir qué sale. */
export function hintNudge(step: TraceStep, t: T, locale: Locale) {
  if (step.tier === 3) return step.rows.length ? t("cifra.nudgeGuessRows", { rows: rowList(step.rows, t, locale) }) : t("cifra.nudgeGuess");
  if (step.tier === 2) return t("cifra.nudgeCross", { rows: rowList(step.rows, t, locale) });
  return t("cifra.nudgeRead", { rows: rowList(step.rows, t, locale) });
}
