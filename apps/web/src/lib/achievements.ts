import { evaluateAchievements, type WorldSize } from "@cranea/core/achievements";
import { WORLDS as CIFRA } from "@cranea/core/cifra";
import { gameAvailable, type Locale } from "@cranea/core/i18n";
import { WORLDS as NONOGRAMA } from "@cranea/core/nonograma";
import { PALABRA_WORLDS as PALABRA } from "@cranea/core/palabra";
import { WORLDS as PUENTES } from "@cranea/core/puentes";
import { WORLDS as TORRES } from "@cranea/core/torres";
import { coveredDays, type GameProgress } from "@/stores/progress";

const sizes = (worlds: WorldSize[]) => worlds.map(({ id, levels }) => ({ id, levels }));

/** Mundos de los juegos en vivo. Al sumar un juego, agregalo acá también. */
export const WORLD_SIZES: Record<string, WorldSize[]> = {
  cifra: sizes(CIFRA),
  puentes: sizes(PUENTES),
  nonograma: sizes(NONOGRAMA),
  palabra: sizes(PALABRA),
  torres: sizes(TORRES),
};

/** Los mundos de los juegos que se ven en el idioma (en inglés no está Palabra: «Pleno» pide 4 diarios). */
export const worldSizesFor = (locale: Locale): Record<string, WorldSize[]> =>
  Object.fromEntries(Object.entries(WORLD_SIZES).filter(([id]) => gameAvailable(id, locale)));

/** Cuántos juegos con diario se ven en el idioma (el {count} de «Pleno»). */
export const dailyGamesFor = (locale: Locale) => Object.keys(worldSizesFor(locale)).length;

/**
 * Estado de cada logro con el progreso del dispositivo (las rachas cuentan los días cubiertos por un protector).
 * Se evalúa con los juegos del idioma y se ocultan los logros de juegos que no están (Palabra en inglés).
 */
export const evaluate = (games: Record<string, GameProgress>, covered: Iterable<string> = coveredDays(), locale: Locale = "es") =>
  evaluateAchievements({ games, worlds: worldSizesFor(locale), covered }).filter((a) => !a.game || gameAvailable(a.game, locale));
