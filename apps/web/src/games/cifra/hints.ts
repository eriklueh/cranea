import { list, type Locale } from "@cranea/core/i18n";
import type { T } from "@/lib/i18n";
import { tileMarkState, traceSolve, type CifraPuzzle, type Clue, type Marks, type Trace, type TraceStep } from "@cranea/core/cifra";

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

/** "la fila 2" / "las filas 1, 2 y 3" ("row 2" / "rows 1, 2 and 3"). */
const rowList = (rows: number[], t: T, locale: Locale) => {
  const n = rows.map((r) => String(r + 1));
  return n.length < 2 ? t("cifra.hintRow", { n: n[0] }) : t("cifra.hintRows", { list: list(n, locale) });
};

/** Primer nivel de la pista: dónde mirar, sin decir qué sale. */
export function hintNudge(step: TraceStep, t: T, locale: Locale) {
  if (step.tier === 3) return step.rows.length ? t("cifra.hintSuppose", { rows: rowList(step.rows, t, locale) }) : t("cifra.hintSupposeAll");
  if (step.tier === 2) return t("cifra.hintCross", { rows: rowList(step.rows, t, locale) });
  return t("cifra.hintRead", { rows: rowList(step.rows, t, locale) });
}
