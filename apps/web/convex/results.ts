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

/**
 * El diario se juega una sola vez: vale la primera partida, aunque venga de otro dispositivo.
 * Excepción: un intento extra (anuncio con recompensa) puede convertir una derrota en victoria
 * para la racha; se reconoce porque usa más intentos que la derrota. El ranking no la cuenta.
 */
export function first(a: Result | undefined, b: Result): Result {
  if (a && !a.won && b.won && b.attempts > a.attempts && b.at > a.at) return b;
  return !a || b.at < a.at ? b : a;
}

/** Intentos de un diario sin ayuda. Más que esto es un intento extra: no cuenta como resuelto en el ranking. */
export const DAILY_MAX_ATTEMPTS: Record<string, number> = { cifra: 3, palabra: 6, nonograma: 3, torres: 3 };

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

/** Nombre público en el ranking: nombre de la cuenta e inicial del apellido ("Erik L."). */
export function publicName(identity: { givenName?: string; familyName?: string; name?: string }): string {
  const clean = (x?: string) => (x ?? "").trim().replace(/s+/g, " ").slice(0, 40);
  const given = clean(identity.givenName), family = clean(identity.familyName);
  if (given) return family ? `${given} ${family[0].toUpperCase()}.` : given;
  const [first, ...rest] = clean(identity.name).split(" ");
  if (!first) return "Jugador";
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}
