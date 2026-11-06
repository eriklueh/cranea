"use client";
import { useSyncExternalStore } from "react";
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
import { messages, type WebMessages } from "@/i18n/messages";
import { getPrefs, usePrefs } from "@/lib/prefs";

/**
 * Idioma en la web. Las páginas se prerenderizan en español; en el cliente, después de hidratar,
 * se pasa al idioma de Ajustes (o al del navegador en «Automático»). El script de prefs-script.ts
 * pone `<html lang>` antes de pintar y, en inglés, oculta el cuerpo hasta hidratar (con un tope).
 */

export type { Locale };
export type T = Translate<WebMessages>;
export type Key = MessageKey<WebMessages>;

const translators: Record<Locale, T> = { es: createTranslator(messages, "es"), en: createTranslator(messages, "en") };

export const translator = (locale: Locale): T => translators[locale];

const deviceTags = () => (typeof navigator === "undefined" ? undefined : navigator.languages?.length ? navigator.languages : [navigator.language]);

const subscribeLanguage = (cb: () => void) => {
  window.addEventListener("languagechange", cb);
  return () => window.removeEventListener("languagechange", cb);
};

/** Idioma activo. En el servidor y al hidratar es español (lo prerenderizado); después, el elegido. */
export function useLocale(): Locale {
  const pref = usePrefs((s) => s.language);
  return useSyncExternalStore(subscribeLanguage, () => resolveLocale(pref, deviceTags()), () => "es");
}

/** `t("espacio.clave", { parámetros })` en el idioma activo. */
export function useT(): T {
  return translators[useLocale()];
}

/** Fuera de React (textos para compartir, avisos). En el servidor, español. */
export function getLocale(): Locale {
  if (typeof window === "undefined") return "es";
  return resolveLocale(getPrefs().language, deviceTags());
}

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
