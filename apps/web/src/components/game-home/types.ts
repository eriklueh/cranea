import type { ReactNode } from "react";
import type { Locale } from "@cranea/core/i18n";
import { translator } from "@/lib/i18n";
import type { Result } from "@/stores/progress";

/**
 * Texto que depende del idioma: fijo (español de siempre) o una función del idioma activo.
 * GameHome lo resuelve con `localized(valor, locale)`. Nombre, bajada y mundos salen de
 * `gameCopy` / `worldCopy` de `@cranea/core/i18n` según `id`.
 */
export type Localized = string | ((locale: Locale) => string);
export const localized = (v: Localized, locale: Locale) => (typeof v === "function" ? v(locale) : v);

/** Lo mínimo de un mundo que necesita el mapa. */
export interface HomeWorld {
  id: number;
  name: string;
  description: string;
  levels: number;
  unlockAfter: number;
}

export type Done = (world: number, level: number) => boolean;

/** Todo lo que cambia entre juegos en su pantalla de inicio. Vive en un módulo de cliente: lleva funciones. */
export interface GameHomeConfig {
  id: string;
  name: string;
  /** Una línea: qué se hace en el juego. */
  pitch: string;
  /** "la" para Palabra ("la de hoy", "Resuelta"); "el" para el resto. */
  article: "el" | "la";
  daily: {
    /** "Cifra del día" */
    title: Localized;
    /** Una línea para quien todavía no lo jugó. */
    blurb: Localized;
    href: string;
    number: (date: string) => number;
    /** Si hay una partida del diario empezada en el dispositivo. */
    inProgress?: (date: string) => boolean;
  };
  worlds: HomeWorld[];
  isWorldUnlocked: (world: number, done: Done) => boolean;
  isLevelUnlocked: (world: number, level: number, done: Done) => boolean;
  levelKey: (world: number, level: number) => string;
  levelHref: (world: number, level: number) => string;
  /** Puntitos de un nivel ganado, de 1 a 3. */
  stars: (r: Result) => number;
  /** "en 2 intentos", "sin errores"… */
  resultText: (r: Result, locale: Locale) => string;
  /** Dato principal de una partida terminada para la tarjeta del diario. */
  resultStat: (r: Result, locale: Locale) => { label: string; value: string };
  /** Qué se completa en cada mundo. Por defecto, niveles. */
  unit?: { one: Localized; many: Localized };
  /** Miniatura de un nivel ganado (los dibujos de Nonograma). */
  thumbnail?: (world: number, level: number) => ReactNode;
  /** Nombre corto de un nivel ganado para lectores de pantalla. */
  levelTitle?: (world: number, level: number, locale: Locale) => string;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "en 2 intentos" / "in 2 tries" */
export const attemptsText = (r: Result, locale: Locale = "es") => {
  const t = translator(locale);
  return t("hub.inAttempts", { text: t("common.attempts", { count: r.attempts }) });
};
