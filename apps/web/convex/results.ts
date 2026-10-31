/** Reglas compartidas por el dispositivo y el servidor para combinar resultados. */

export interface Result {
  won: boolean;
  attempts: number;
  timeMs: number;
  at: number;
}

export type Kind = "level" | "daily";

/** Un nivel conserva tu mejor partida: ganar, menos intentos y después menos tiempo. */
export function better(a: Result | undefined, b: Result): Result {
  if (!a || !a.won) return b.won || !a ? b : a;
  if (!b.won) return a;
  if (b.attempts !== a.attempts) return b.attempts < a.attempts ? b : a;
  return b.timeMs < a.timeMs ? b : a;
}

/** El diario se juega una sola vez: vale la primera partida, aunque venga de otro dispositivo. */
export function first(a: Result | undefined, b: Result): Result {
  return !a || b.at < a.at ? b : a;
}

export const combine = (kind: Kind, a: Result | undefined, b: Result) => (kind === "level" ? better(a, b) : first(a, b));

const DAY_MS = 86_400_000;

/**
 * El ranking del día D solo acepta partidas terminadas durante D (UTC), con
 * un margen para quien empezó justo antes de medianoche, y nunca en el futuro.
 */
export function rankable(date: string, r: Result, now = Date.now()): boolean {
  const start = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(start)) return false;
  return r.at >= start && r.at <= start + DAY_MS + 2 * 3_600_000 && r.at <= now + 5 * 60_000 && r.timeMs >= 1000 && r.timeMs <= DAY_MS;
}

export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 20;

/** Limpia un apodo; devuelve null si no es válido (letras, números, espacio, punto, guion y guion bajo). */
export function cleanNickname(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < NICKNAME_MIN || name.length > NICKNAME_MAX) return null;
  return /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(name) ? name : null;
}
