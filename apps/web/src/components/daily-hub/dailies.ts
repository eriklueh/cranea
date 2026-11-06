import { GAMES } from "@/games/registry";
import { formatTime } from "@/lib/utils";
import type { ShareCard } from "@/components/share/share-image";
import { protectedFullStreak } from "@cranea/core/protectors";
import { gamesFor, type Locale } from "@cranea/core/i18n";
import { translator } from "@/lib/i18n";
import { coveredDays, type GameProgress, type Result } from "@/stores/progress";

/**
 * Lo que el inicio necesita saber del diario de cada juego, sin cargar sus niveles.
 * Las fechas de lanzamiento son las de `games/<juego>/data.ts` (LAUNCH_DATE): si cambia una, cambiala acá.
 */
const META: Record<string, { launch: string; short: (r: Result, locale: Locale) => string }> = {
  cifra: { launch: "2026-10-22", short: (r) => `${r.attempts}/3` },
  puentes: {
    launch: "2026-10-31",
    short: (r, locale) => {
      const t = translator(locale);
      return r.attempts <= 1 ? t("hub.noMistakes") : t("common.errors", { count: r.attempts - 1 });
    },
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

/** "31/10" en español, "10/31" en inglés. */
export const shortDate = (date: string, locale: Locale = "es") =>
  locale === "en" ? `${date.slice(5, 7)}/${date.slice(8, 10)}` : `${date.slice(8, 10)}/${date.slice(5, 7)}`;

/** Los juegos con diario que se ven en el idioma (en inglés no está Palabra). */
const liveGames = (locale: Locale) => gamesFor(GAMES, locale).filter((g) => g.status === "live");

export interface DailyEntry {
  id: string;
  name: string;
  href: string;
  result: Result | null;
}

/** Los diarios de una fecha en el orden del registro (los visibles en el idioma). */
export function dailiesFor(games: Record<string, GameProgress | undefined>, date: string, locale: Locale = "es"): DailyEntry[] {
  return liveGames(locale).map((g) => ({
    id: g.id,
    name: g.name,
    href: `${g.path}/diario`,
    result: games[g.id]?.daily[date] ?? null,
  }));
}

/**
 * Racha Craneá: días UTC seguidos con todos los diarios visibles jugados (ganados o no),
 * hasta hoy, o hasta ayer si hoy todavía faltan. Los días cubiertos por un protector puentean.
 * En inglés no cuenta Palabra (no se ve).
 */
export function craneaStreak(
  games: Record<string, GameProgress | undefined>,
  today: string,
  locale: Locale = "es",
  covered: ReadonlySet<string> = coveredDays(),
): number {
  const ids = liveGames(locale).map((g) => g.id);
  return protectedFullStreak((d) => ids.every((id) => games[id]?.daily[d]), today, covered);
}

/** "2/3 · 1:11", "sin errores · 2:40"; sin datos que adelanten la solución. */
export function resultLine(id: string, r: Result, locale: Locale = "es") {
  if (!r.won) return "X";
  const short = META[id]?.short(r, locale) ?? `${r.attempts}`;
  return `${short} · ${formatTime(r.timeMs)}`;
}

export const launchOf = (id: string) => META[id]?.launch ?? CRANEA_LAUNCH;

/** Texto para compartir el día. */
export function dayShareText(entries: DailyEntry[], date: string, host: string, locale: Locale = "es") {
  const t = translator(locale);
  const lines = entries.map((e) =>
    !e.result ? `${e.name} ⬜ ${t("hub.sharePending")}` : e.result.won ? `${e.name} 🟩 ${resultLine(e.id, e.result, locale)}` : `${e.name} 🟥 X`,
  );
  return [`Craneá #${dayNumber(date, CRANEA_LAUNCH)} · ${shortDate(date, locale)}`, ...lines, host].join("\n");
}

/** La misma información que el texto, como tarjeta para la imagen. */
export function dayShareCard(entries: DailyEntry[], date: string, streak: number, host: string, locale: Locale = "es"): ShareCard {
  const t = translator(locale);
  const done = entries.filter((e) => e.result).length;
  return {
    title: `Craneá #${dayNumber(date, CRANEA_LAUNCH)}`,
    subtitle: t("hub.shareSubtitle", { date: shortDate(date, locale), done, total: entries.length }),
    rows: entries.map((e) => ({
      label: e.name,
      state: !e.result ? "pending" : e.result.won ? "won" : "lost",
      detail: !e.result ? t("hub.sharePending") : e.result.won ? resultLine(e.id, e.result, locale) : t("hub.missed"),
    })),
    note: streak > 1 ? t("hub.shareStreak", { count: streak }) : undefined,
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
