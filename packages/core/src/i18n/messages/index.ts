import type { AchievementState } from "../../achievements";
import { createTranslator, type Locale, type Shape } from "../translate";
import * as achievements from "./achievements";
import * as common from "./common";
import * as games from "./games";
import * as notifications from "./notifications";
import * as tutorial from "./tutorial";

/** Espacios de nombres compartidos por la web y la app. Cada app suma los suyos (ver docs/i18n.md). */
const es = {
  common: common.es,
  games: games.es,
  achievements: achievements.es,
  notifications: notifications.es,
  tutorial: tutorial.es,
};

const en: Shape<typeof es> = {
  common: common.en,
  games: games.en,
  achievements: achievements.en,
  notifications: notifications.en,
  tutorial: tutorial.en,
};

export type CoreMessages = typeof es;
export const coreMessages = { es, en };

/** Nombre, subtítulo (solo en inglés) y bajada de un juego del registro. */
export function gameCopy(id: string, locale: Locale) {
  const t = createTranslator(coreMessages, locale) as (key: string, params?: Record<string, string | number>) => string;
  const has = (k: string) => (games.es as Record<string, unknown>)[k] !== undefined;
  const key = (k: string) => `games.${id}${k}`;
  if (!has(`${id}Name`)) return { name: id, subtitle: "", tagline: "" };
  return { name: t(key("Name")), subtitle: t(key("Sub")), tagline: t(key("Tagline")) };
}

/** Nombre y descripción de un logro. `games`: cuántos juegos con diario se ven (para «Pleno»). */
export function achievementCopy(a: Pick<AchievementState, "id">, locale: Locale, games: number) {
  const t = createTranslator(coreMessages, locale) as (key: string, params?: Record<string, string | number>) => string;
  return { name: t(`achievements.${a.id}.name`), description: t(`achievements.${a.id}.desc`, { count: games }) };
}
