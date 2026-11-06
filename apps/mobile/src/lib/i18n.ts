import { getLocales, useLocales } from "expo-localization";
import {
  createTranslator,
  gameAvailable,
  gameCopy,
  gamesFor,
  intlLocale,
  resolveLocale,
  type Locale,
  type MessageKey,
  type Params,
  type Translate,
} from "@cranea/core/i18n";
import { messages, type AppMessages } from "@/i18n/messages";
import { getPrefs, usePrefs } from "@/lib/prefs";

/**
 * Idioma en la app: Ajustes (`language`) → idioma del teléfono (expo-localization) → español.
 * `useLocale`/`useT` vuelven a dibujar al cambiar Ajustes o el idioma del sistema. Ver docs/i18n.md.
 */

export type { Locale };
export type T = Translate<AppMessages>;
export type Key = MessageKey<AppMessages>;

const translators: Record<Locale, T> = { es: createTranslator(messages, "es"), en: createTranslator(messages, "en") };

export const translator = (locale: Locale): T => translators[locale];

const tags = (locales: { languageTag: string }[]) => locales.map((l) => l.languageTag);

function deviceTags(): string[] {
  try {
    return tags(getLocales());
  } catch {
    return [];
  }
}

/** Idioma activo; cambia con Ajustes y con el idioma del sistema. */
export function useLocale(): Locale {
  const pref = usePrefs((s) => s.language);
  const device = useLocales();
  return resolveLocale(pref, tags(device));
}

/** `t("espacio.clave", { parámetros })` en el idioma activo. */
export function useT(): T {
  return translators[useLocale()];
}

/** Fuera de React (notificaciones, textos para compartir). */
export const getLocale = (): Locale => resolveLocale(getPrefs().language, deviceTags());

export const getT = (): T => translators[getLocale()];

/** Para claves armadas en tiempo de ejecución (`games.${id}Name`). Preferí las claves fijas. */
export const tDynamic = (t: T, key: string, params?: Params) => (t as (k: string, p?: Params) => string)(key, params);

/** Nombre, subtítulo (en inglés: «Bridges») y bajada de un juego. */
export function useGameCopy(id: string) {
  return gameCopy(id, useLocale());
}

/** Los juegos que se ven en el idioma activo (Palabra solo en español). */
export function useVisibleGames<G extends { id: string }>(games: readonly G[]): G[] {
  return gamesFor(games, useLocale());
}

export function useGameAvailable(id: string) {
  return gameAvailable(id, useLocale());
}

/** Etiqueta de `Intl` del idioma activo, para fechas y números. */
export function useIntlLocale() {
  return intlLocale(useLocale());
}
