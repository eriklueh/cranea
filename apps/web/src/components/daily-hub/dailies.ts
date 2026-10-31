import { GAMES } from "@/games/registry";
import { formatTime } from "@/lib/utils";
import type { ShareCard } from "@/components/share/share-image";
import type { GameProgress, Result } from "@/stores/progress";

/**
 * Lo que el inicio necesita saber del diario de cada juego, sin cargar sus niveles.
 * Las fechas de lanzamiento son las de `games/<juego>/data.ts` (LAUNCH_DATE): si cambia una, cambiala acá.
 */
const META: Record<string, { launch: string; short: (r: Result) => string }> = {
  cifra: { launch: "2026-10-22", short: (r) => `${r.attempts}/3` },
  puentes: {
    launch: "2026-10-31",
    short: (r) => (r.attempts <= 1 ? "sin errores" : r.attempts === 2 ? "1 error" : `${r.attempts - 1} errores`),
  },
  nonograma: { launch: "2026-10-31", short: (r) => `${r.attempts}/3` },
  palabra: { launch: "2026-10-31", short: (r) => `${r.attempts}/6` },
  torres: { launch: "2026-10-31", short: (r) => `${r.attempts}/3` },
};

/** Primer día con los cinco diarios: de acá sale el número de "Craneá #N". */
export const CRANEA_LAUNCH = "2026-10-31";

const DAY_MS = 86_400_000;

export const dayNumber = (date: string, launch: string) =>
  Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${launch}T00:00:00Z`)) / DAY_MS) + 1;

export const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** "31/10" */
export const shortDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

export interface DailyEntry {
  id: string;
  name: string;
  href: string;
  result: Result | null;
}

/** Los diarios de una fecha en el orden del registro. */
export function dailiesFor(games: Record<string, GameProgress | undefined>, date: string): DailyEntry[] {
  return GAMES.filter((g) => g.status === "live").map((g) => ({
    id: g.id,
    name: g.name,
    href: `${g.path}/diario`,
    result: games[g.id]?.daily[date] ?? null,
  }));
}

/**
 * Racha Craneá: días UTC seguidos con todos los diarios jugados (ganados o no),
 * hasta hoy, o hasta ayer si hoy todavía faltan.
 */
export function craneaStreak(games: Record<string, GameProgress | undefined>, today: string): number {
  const ids = GAMES.filter((g) => g.status === "live").map((g) => g.id);
  const complete = (d: string) => ids.every((id) => games[id]?.daily[d]);
  let d = complete(today) ? today : addDays(today, -1);
  let n = 0;
  while (complete(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** "2/3 · 1:11", "sin errores · 2:40"; sin datos que adelanten la solución. */
export function resultLine(id: string, r: Result) {
  if (!r.won) return "X";
  const short = META[id]?.short(r) ?? `${r.attempts}`;
  return `${short} · ${formatTime(r.timeMs)}`;
}

export const launchOf = (id: string) => META[id]?.launch ?? CRANEA_LAUNCH;

/** Texto para compartir el día. */
export function dayShareText(entries: DailyEntry[], date: string, host: string) {
  const lines = entries.map((e) =>
    !e.result ? `${e.name} ⬜ pendiente` : e.result.won ? `${e.name} 🟩 ${resultLine(e.id, e.result)}` : `${e.name} 🟥 X`,
  );
  return [`Craneá #${dayNumber(date, CRANEA_LAUNCH)} · ${shortDate(date)}`, ...lines, host].join("\n");
}

/** La misma información que el texto, como tarjeta para la imagen. */
export function dayShareCard(entries: DailyEntry[], date: string, streak: number, host: string): ShareCard {
  const done = entries.filter((e) => e.result).length;
  return {
    title: `Craneá #${dayNumber(date, CRANEA_LAUNCH)}`,
    subtitle: `${shortDate(date)} · ${done} de ${entries.length} diarios`,
    rows: entries.map((e) => ({
      label: e.name,
      state: !e.result ? "pending" : e.result.won ? "won" : "lost",
      detail: !e.result ? "pendiente" : e.result.won ? resultLine(e.id, e.result) : "no salió",
    })),
    note: streak > 1 ? `Racha Craneá: ${streak} días` : undefined,
    footer: host,
  };
}

/** La fecha pedida por `?fecha=` si es un diario pasado del juego (desde su lanzamiento hasta ayer); si no, null. */
export function archiveDate(requested: string | null, launch: string, today: string): string | null {
  if (!requested || !/^\d{4}-\d{2}-\d{2}$/.test(requested)) return null;
  const t = Date.parse(`${requested}T00:00:00Z`);
  if (!Number.isFinite(t) || new Date(t).toISOString().slice(0, 10) !== requested) return null;
  return requested >= launch && requested < today ? requested : null;
}
