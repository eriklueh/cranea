/**
 * Protector de racha. Lógica pura compartida por la web, la app y el servidor.
 *
 * Reglas:
 * - Un protector cubre un **día UTC entero sin ningún diario jugado** (de cualquier juego). Un día en el que
 *   jugaste algo no es un día perdido: si perdiste un diario, esa racha se corta igual.
 * - Se gana 1 cada 7 días seguidos jugados (días cubiertos no cortan la cuenta, pero tampoco suman). Máximo 2.
 * - Con Plus: el primer día de cada mes calendario en que se abre la app con Plus, el stock pasa a 2
 *   (no se acumula más allá de 2).
 * - Se usan solos, solo si salvan la racha: hace falta haber jugado el día anterior al hueco (o que esté
 *   cubierto) y que alcancen para **todo** el hueco. Si faltaste más días de los que tenés, la racha se corta
 *   y los protectores quedan guardados. Hoy nunca se cubre (todavía se puede jugar).
 * - Un día cubierto puentea todas las rachas: la de cada juego (diarios ganados) y la Racha Craneá
 *   (los cinco jugados). No suma días a ninguna.
 *
 * El estado guardado es mínimo (`ProtectorState`); stock y días cubiertos se **derivan** del historial de
 * diarios, que ya se sincroniza. Así dos dispositivos con el mismo historial siempre ven lo mismo, sin
 * gastar dos veces el mismo protector.
 */

export const MAX_PROTECTORS = 2;
export const DAYS_PER_PROTECTOR = 7;

export interface ProtectorState {
  /** Primer día (UTC) en que corrieron las reglas para este jugador. No se cubre nada antes. */
  since: string;
  /** Días (UTC) en que se vio Plus por primera vez en cada mes: ahí el stock pasa a 2. Uno por mes. */
  plus: string[];
  /** Días cubiertos que ya se avisaron (para mostrar el aviso una sola vez). */
  seen: string[];
}

export interface ProtectorStatus {
  /** Protectores disponibles ahora. */
  stock: number;
  /** Días cubiertos por un protector, en orden. */
  covered: string[];
  /** Días seguidos jugados que cuentan para el próximo (0–6). */
  run: number;
  /** Días que faltan jugar para ganar el próximo (si el stock no está lleno). */
  nextIn: number;
}

const DAY_MS = 86_400_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const isDate = (s: unknown): s is string => typeof s === "string" && DATE.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`));

/** Días con al menos un diario jugado (ganado o no), de cualquier juego. */
export function playedDays(games: Record<string, { daily: Record<string, unknown> } | undefined>): Set<string> {
  const days = new Set<string>();
  for (const g of Object.values(games)) if (g) for (const d of Object.keys(g.daily)) days.add(d);
  return days;
}

export const emptyProtectors = (today: string): ProtectorState => ({ since: today, plus: [], seen: [] });

/** Calcula stock y días cubiertos desde `state.since` hasta hoy. */
export function protectorStatus(state: ProtectorState | undefined, played: Set<string>, today: string): ProtectorStatus {
  if (!state || !isDate(state.since) || state.since > today) {
    return { stock: 0, covered: [], run: 0, nextIn: DAYS_PER_PROTECTOR };
  }
  const grants = new Set(state.plus);
  let stock = 0;
  // Los días jugados justo antes de `since` cuentan para el primero.
  let run = 0;
  for (let d = addDays(state.since, -1); played.has(d) && run < 400; d = addDays(d, -1)) run++;
  run %= DAYS_PER_PROTECTOR;
  const covered: string[] = [];

  const play = () => {
    run++;
    if (run === DAYS_PER_PROTECTOR) {
      run = 0;
      stock = Math.min(MAX_PROTECTORS, stock + 1);
    }
  };

  // `active`: el día anterior se jugó o estaba cubierto, así que hay una racha que salvar.
  let active = played.has(addDays(state.since, -1));
  let d = state.since;
  while (d < today) {
    if (grants.has(d)) stock = MAX_PROTECTORS;
    if (played.has(d)) {
      play();
      active = true;
      d = addDays(d, 1);
      continue;
    }
    // Hueco: días seguidos sin jugar, hasta ayer como mucho.
    const gap: string[] = [];
    for (let x = d; x < today && !played.has(x); x = addDays(x, 1)) gap.push(x);
    let s = stock;
    let ok = active;
    for (const x of gap) {
      if (grants.has(x)) s = MAX_PROTECTORS;
      if (!ok) continue;
      if (s === 0) ok = false;
      else s--;
    }
    if (ok) covered.push(...gap);
    else {
      // La racha se corta: no se gasta nada, pero un regalo de Plus en el hueco igual llegó.
      s = gap.some((x) => grants.has(x)) ? MAX_PROTECTORS : stock;
      run = 0;
      active = false;
    }
    stock = s;
    d = addDays(gap[gap.length - 1], 1);
  }
  // Hoy: el regalo de Plus y lo ganado jugando ya se ven; hoy nunca se cubre.
  if (grants.has(today)) stock = MAX_PROTECTORS;
  if (played.has(today)) play();
  return { stock, covered, run, nextIn: DAYS_PER_PROTECTOR - run };
}

/** Anota el regalo mensual de Plus si este mes todavía no se anotó. Devuelve el mismo objeto si no cambia. */
export function grantPlus(state: ProtectorState, today: string): ProtectorState {
  const month = today.slice(0, 7);
  if (state.plus.some((d) => d.startsWith(month))) return state;
  return { ...state, plus: [...state.plus, today].sort() };
}

/**
 * Combina dos estados (dispositivo y cuenta): `since` el más antiguo, por cada mes el primer día de Plus,
 * y la unión de los avisos ya vistos. Es conmutativa e idempotente, así que el orden de las
 * sincronizaciones no importa. Como stock y días cubiertos se derivan del historial, combinar nunca
 * duplica protectores.
 */
export function mergeProtectors(a: ProtectorState | undefined, b: ProtectorState | undefined): ProtectorState | undefined {
  if (!a || !isDate(a.since)) return b && sanitize(b);
  if (!b || !isDate(b.since)) return sanitize(a);
  const byMonth = new Map<string, string>();
  for (const d of [...a.plus, ...b.plus]) {
    if (!isDate(d)) continue;
    const m = d.slice(0, 7);
    const prev = byMonth.get(m);
    if (!prev || d < prev) byMonth.set(m, d);
  }
  return {
    since: a.since < b.since ? a.since : b.since,
    plus: [...byMonth.values()].sort(),
    seen: [...new Set([...a.seen, ...b.seen].filter(isDate))].sort(),
  };
}

/** Limpia datos raros y recorta listas (por si vienen de otro lado). */
export function sanitize(s: ProtectorState): ProtectorState | undefined {
  if (!s || !isDate(s.since)) return undefined;
  const plus = Array.isArray(s.plus) ? s.plus.filter(isDate) : [];
  const seen = Array.isArray(s.seen) ? s.seen.filter(isDate) : [];
  return { since: s.since, plus: [...new Set(plus)].sort().slice(-60), seen: [...new Set(seen)].sort().slice(-120) };
}

export function sameProtectors(a: ProtectorState | undefined, b: ProtectorState | undefined): boolean {
  if (!a || !b) return a === b;
  return a.since === b.since && a.plus.join() === b.plus.join() && a.seen.join() === b.seen.join();
}

/**
 * Racha de diarios ganados seguidos de un juego, contando hasta hoy (o ayer si hoy todavía no ganaste).
 * Los días cubiertos puentean sin sumar.
 */
export function protectedStreak(daily: Record<string, { won: boolean }>, today: string, covered: ReadonlySet<string> = EMPTY): number {
  let d = daily[today]?.won ? today : addDays(today, -1);
  let n = 0;
  for (let guard = 0; guard < 5000; guard++) {
    if (daily[d]?.won) n++;
    else if (!covered.has(d)) break;
    d = addDays(d, -1);
  }
  return n;
}

/** La racha más larga de diarios ganados, con los días cubiertos como puente. */
export function protectedBestStreak(daily: Record<string, { won: boolean }>, covered: ReadonlySet<string> = EMPTY): number {
  const days = Object.keys(daily).filter((d) => daily[d].won).sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && bridged(days[i - 1], days[i], covered) ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** true si entre dos días solo hay días cubiertos (o ninguno). */
export function bridged(from: string, to: string, covered: ReadonlySet<string>): boolean {
  let d = addDays(from, 1);
  for (let guard = 0; d < to && guard < 400; guard++) {
    if (!covered.has(d)) return false;
    d = addDays(d, 1);
  }
  return d === to;
}

/** Racha Craneá: días seguidos con todos los diarios jugados (ganados o no); los cubiertos puentean. */
export function protectedFullStreak(complete: (date: string) => boolean, today: string, covered: ReadonlySet<string> = EMPTY): number {
  let d = complete(today) ? today : addDays(today, -1);
  let n = 0;
  for (let guard = 0; guard < 5000; guard++) {
    if (complete(d)) n++;
    else if (!covered.has(d)) break;
    d = addDays(d, -1);
  }
  return n;
}

/** Días cubiertos todavía sin avisar. */
export const unseenCovered = (status: ProtectorStatus, state: ProtectorState | undefined) => {
  const seen = new Set(state?.seen ?? []);
  return status.covered.filter((d) => !seen.has(d));
};

const EMPTY: ReadonlySet<string> = new Set();
