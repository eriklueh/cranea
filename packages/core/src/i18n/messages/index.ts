import type { AchievementState } from "../../achievements";
import { createTranslator, type Locale, type Shape } from "../translate";
import * as achievements from "./achievements";
import * as common from "./common";
import * as games from "./games";
import * as notifications from "./notifications";
import * as pictures from "./pictures";
import * as worlds from "./worlds";
import * as tutorial from "./tutorial";
import * as tutorialCifra from "./tutorials/cifra";
import * as tutorialPuentes from "./tutorials/puentes";
import * as tutorialTorres from "./tutorials/torres";
import * as tutorialPalabra from "./tutorials/palabra";
import * as tutorialNonograma from "./tutorials/nonograma";

/** Espacios de nombres compartidos por la web y la app. Cada app suma los suyos (ver docs/i18n.md). */
const es = {
  common: common.es,
  games: games.es,
  achievements: achievements.es,
  notifications: notifications.es,
  worlds: worlds.es,
  pictures: pictures.es,
  tutorial: tutorial.es,
  tutorialCifra: tutorialCifra.es,
  tutorialPuentes: tutorialPuentes.es,
  tutorialTorres: tutorialTorres.es,
  tutorialPalabra: tutorialPalabra.es,
  tutorialNonograma: tutorialNonograma.es,
};

const en: Shape<typeof es> = {
  common: common.en,
  games: games.en,
  achievements: achievements.en,
  notifications: notifications.en,
  worlds: worlds.en,
  pictures: pictures.en,
  tutorial: tutorial.en,
  tutorialCifra: tutorialCifra.en,
  tutorialPuentes: tutorialPuentes.en,
  tutorialTorres: tutorialTorres.en,
  tutorialPalabra: tutorialPalabra.en,
  tutorialNonograma: tutorialNonograma.en,
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

/** Nombre y descripción de un mundo. Si no hay traducción, los de levels.ts. */
export function worldCopy(gameId: string, world: { id: number; name: string; description: string }, locale: Locale) {
  const msgs = (locale === "en" ? en : es).worlds as Record<string, string>;
  const k = `${gameId}${world.id}`;
  return { name: msgs[k] ?? world.name, description: msgs[`${k}Desc`] ?? world.description };
}

/** Título de un dibujo del Nonograma (se guarda en español en los niveles). */
export function pictureTitle(title: string, locale: Locale): string {
  return ((locale === "en" ? en : es).pictures as Record<string, string>)[title] ?? title;
}
