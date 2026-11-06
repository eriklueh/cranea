import { gamesFor, type Locale } from "./i18n/translate";
import { playedDays, protectedStreak, protectorStatus, type ProtectorState } from "./protectors";

/**
 * Estado del widget «Diarios de hoy» (Android) a partir del progreso guardado (`cranea-progress`).
 * Puro: lo usa la app al pedir una actualización y la tarea en segundo plano del widget, que lee
 * AsyncStorage y calcula «hoy» (UTC) con el reloj del teléfono.
 */

export type DailyStatus = "won" | "lost" | "pending";

export interface WidgetProgress {
  games: Record<string, { daily: Record<string, { won: boolean }> } | undefined>;
  protectors?: ProtectorState;
}

export interface DailyWidgetState {
  today: string;
  /** Diario de hoy de cada juego visible, en el orden del registro (en inglés no está Palabra). */
  games: { id: string; status: DailyStatus }[];
  done: number;
  total: number;
  allDone: boolean;
  /** Primer diario sin jugar (orden del registro), o null si ya están todos. */
  next: string | null;
  /** La racha de diarios ganados más larga entre los juegos visibles (con protectores como puente). */
  streak: number;
  /** Protectores de racha disponibles. */
  protectors: number;
  /** Adónde lleva el toque: el próximo diario o el inicio. */
  link: string;
}

export const WIDGET_SCHEME = "cranea";

/** `cranea://cifra/diario` para un juego; `cranea:///` (inicio) si no hay ninguno. */
export const widgetLink = (gameId: string | null) => (gameId ? `${WIDGET_SCHEME}://${gameId}/diario` : `${WIDGET_SCHEME}:///`);

export function dailyWidgetState(
  progress: WidgetProgress,
  opts: { gameIds: readonly string[]; locale: Locale; today: string },
): DailyWidgetState {
  const { today, locale } = opts;
  const visible = gamesFor(opts.gameIds.map((id) => ({ id })), locale);
  const games = visible.map(({ id }) => {
    const r = progress.games[id]?.daily[today];
    const status: DailyStatus = r ? (r.won ? "won" : "lost") : "pending";
    return { id, status };
  });
  const done = games.filter((g) => g.status !== "pending").length;
  const next = games.find((g) => g.status === "pending")?.id ?? null;
  const status = protectorStatus(progress.protectors, playedDays(progress.games), today);
  const covered = new Set(status.covered);
  const streak = Math.max(0, ...games.map((g) => protectedStreak(progress.games[g.id]?.daily ?? {}, today, covered)));
  return {
    today,
    games,
    done,
    total: games.length,
    allDone: games.length > 0 && done === games.length,
    next,
    streak,
    protectors: status.stock,
    link: widgetLink(next),
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Lee lo que zustand guarda en `cranea-progress` (`{ state: { games, protectors? }, version: 1 }`)
 * sin confiar en el formato: lo que no se entiende se ignora.
 */
export function parseStoredProgress(raw: unknown): WidgetProgress {
  const state = isObj(raw) && isObj(raw.state) ? raw.state : {};
  const games: WidgetProgress["games"] = {};
  if (isObj(state.games)) {
    for (const [id, g] of Object.entries(state.games)) {
      if (!isObj(g) || !isObj(g.daily)) continue;
      const daily: Record<string, { won: boolean }> = {};
      for (const [date, r] of Object.entries(g.daily)) if (isObj(r) && typeof r.won === "boolean") daily[date] = { won: r.won };
      games[id] = { daily };
    }
  }
  const p = state.protectors;
  const protectors =
    isObj(p) && typeof p.since === "string"
      ? { since: p.since, plus: Array.isArray(p.plus) ? p.plus.filter((d): d is string => typeof d === "string") : [], seen: Array.isArray(p.seen) ? p.seen.filter((d): d is string => typeof d === "string") : [] }
      : undefined;
  return { games, protectors };
}
