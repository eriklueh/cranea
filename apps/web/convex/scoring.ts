/**
 * Puntos de los rankings de semana y mes (y del General de cada día). Puro: lo usan el servidor y la web.
 *
 * Cada diario oficial suma por su resultado, no por su puesto: así el puntaje se calcula al publicarlo
 * y no cambia cuando llegan otros jugadores (un puesto o un percentil obligaría a recalcular todo el día).
 *
 * - Jugar el diario: 2 puntos, aunque no salga. La constancia cuenta.
 * - Resolverlo: 8 puntos más.
 * - Intentos: hasta 5 más; 5 con el primero y 0 con el último permitido.
 * - Tiempo (medido por el servidor): hasta 5 más; 5 hasta el tiempo de referencia del juego,
 *   bajando parejo hasta 0 en cuatro veces ese tiempo.
 *
 * Máximo por diario: 20. Por semana, 140 por juego y 700 en el General (los 5 juegos).
 * Empates: más diarios resueltos, después menos tiempo total.
 */

export interface ScoredResult {
  won: boolean;
  attempts: number;
  timeMs: number;
}

/** Juegos con ranking. */
export const RANKED_GAMES = ["cifra", "puentes", "nonograma", "palabra", "torres"] as const;
/** Tablero que suma los 5 juegos. */
export const OVERALL = "all";

/** Intentos con los que el bonus llega a 0. En Puentes cada error suma un intento y no hay tope. */
const MAX_ATTEMPTS: Record<string, number> = { cifra: 3, puentes: 4, nonograma: 3, palabra: 6, torres: 3 };
/** Tiempo de referencia (un diario bien jugado, sin apuro). */
const PAR_MS: Record<string, number> = { cifra: 180_000, puentes: 180_000, nonograma: 240_000, palabra: 120_000, torres: 240_000 };

export const POINTS = { played: 2, won: 8, attempts: 5, time: 5 } as const;

export function attemptPoints(gameId: string, attempts: number): number {
  const max = MAX_ATTEMPTS[gameId] ?? 3;
  const used = Math.min(Math.max(attempts, 1), max);
  return Math.round((POINTS.attempts * (max - used)) / (max - 1));
}

export function timePoints(gameId: string, timeMs: number): number {
  const par = PAR_MS[gameId] ?? 180_000;
  if (timeMs <= par) return POINTS.time;
  if (timeMs >= 4 * par) return 0;
  return Math.round((POINTS.time * (4 * par - timeMs)) / (3 * par));
}

export function dailyPoints(gameId: string, r: ScoredResult): number {
  if (!r.won) return POINTS.played;
  return POINTS.played + POINTS.won + attemptPoints(gameId, r.attempts) + timePoints(gameId, r.timeMs);
}

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export type PeriodKind = "day" | "week" | "month";

/** Semana ISO (lunes a domingo, UTC): "2026-W44". */
export function weekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const weekday = (d.getUTCDay() + 6) % 7; // lunes = 0
  // El jueves de esa semana define el año ISO.
  const thursday = new Date(d.getTime() + (3 - weekday) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const firstThursday = Date.UTC(year, 0, 4) + (3 - ((new Date(Date.UTC(year, 0, 4)).getUTCDay() + 6) % 7)) * DAY_MS;
  const week = 1 + Math.round((thursday.getTime() - firstThursday) / (7 * DAY_MS));
  return `${year}-W${pad(week)}`;
}

/** Mes calendario (UTC): "2026-10". */
export const monthKey = (date: string) => date.slice(0, 7);

export function periodKey(kind: PeriodKind, date: string): string {
  return kind === "day" ? date : kind === "week" ? weekKey(date) : monthKey(date);
}

/** Primer y último día (YYYY-MM-DD, inclusive) del período que contiene `date`. */
export function periodRange(kind: PeriodKind, date: string): { from: string; to: string } {
  if (kind === "day") return { from: date, to: date };
  const d = new Date(`${date}T00:00:00Z`);
  if (kind === "week") {
    const monday = d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS;
    return { from: dayKey(monday), to: dayKey(monday + 6 * DAY_MS) };
  }
  const first = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const last = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
  return { from: dayKey(first), to: dayKey(last) };
}

/** Un día del período anterior (`step = -1`) o siguiente (`step = 1`). */
export function shiftPeriod(kind: PeriodKind, date: string, step: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (kind === "month") return dayKey(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + step, 1));
  return dayKey(d.getTime() + step * (kind === "week" ? 7 : 1) * DAY_MS);
}

export interface Totals {
  points: number;
  wins: number;
  played: number;
  timeMs: number;
}

/** Suma un conjunto de diarios oficiales. */
export function totals(rows: (ScoredResult & { gameId: string })[]): Totals {
  const t: Totals = { points: 0, wins: 0, played: 0, timeMs: 0 };
  for (const r of rows) {
    t.points += dailyPoints(r.gameId, r);
    t.played++;
    if (r.won) {
      t.wins++;
      t.timeMs += r.timeMs;
    }
  }
  return t;
}

/**
 * Un solo número para ordenar el tablero con un índice: puntos, después diarios resueltos,
 * después menos tiempo. Entero exacto (< 2^53) para cualquier mes.
 */
export function orderKey(t: Totals): number {
  const seconds = Math.min(Math.floor(t.timeMs / 1000), 999_999_999);
  return t.points * 1e12 + Math.min(t.wins, 999) * 1e9 + (999_999_999 - seconds);
}
