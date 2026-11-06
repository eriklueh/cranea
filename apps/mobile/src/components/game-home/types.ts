import type { Href } from "expo-router";
import type { ReactNode } from "react";
import type { Locale } from "@cranea/core/i18n";
import { getLocale, translator } from "@/lib/i18n";
import type { GameProgress, Result } from "@/stores/progress";

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

/** Todo lo que cambia entre juegos en su pantalla de inicio (igual que la web: components/game-home/types.ts). */
export interface GameHomeConfig {
  id: string;
  name: string;
  pitch: string;
  /** "la" para Palabra ("la de hoy", "Resuelta"); "el" para el resto. */
  article: "el" | "la";
  daily: {
    title: Localized;
    blurb: Localized;
    href: Href;
    number: (date: string) => number;
    /** Si hay una partida del diario empezada en el dispositivo. */
    inProgress?: (date: string) => Promise<boolean>;
  };
  worlds: HomeWorld[];
  isWorldUnlocked: (world: number, done: Done) => boolean;
  isLevelUnlocked: (world: number, level: number, done: Done) => boolean;
  /** Sin Craneá Plus (lo agrega GameHome): si el mundo entero es de Plus o, con `level`, si ese nivel lo es. */
  planLocked?: (world: number, level?: number) => boolean;
  levelKey: (world: number, level: number) => string;
  levelHref: (world: number, level: number) => Href;
  howToHref?: Href;
  /** Puntitos de un nivel ganado, de 1 a 3. */
  stars: (r: Result) => number;
  resultText: (r: Result, locale: Locale) => string;
  resultStat: (r: Result, locale: Locale) => { label: string; value: string };
  /** Miniatura de un nivel ganado en la grilla (el dibujo de Nonograma), en lugar del número. */
  thumbnail?: (world: number, level: number) => ReactNode;
  /** Nombre de un nivel ganado, para el lector de pantalla. */
  levelTitle?: (world: number, level: number, locale: Locale) => string;
}

/** "en 2 intentos" / "in 2 tries". Sirve como `resultText` de un juego. */
export const attemptsText = (r: Result, locale: Locale = getLocale()) => translator(locale)("hub.inAttempts", { count: r.attempts });

export const doneFor = (config: GameHomeConfig, progress: GameProgress): Done => (w, l) =>
  Boolean(progress.levels[config.levelKey(w, l)]?.won);

export function wonIn(world: HomeWorld, done: Done) {
  let n = 0;
  for (let l = 1; l <= world.levels; l++) if (done(world.id, l)) n++;
  return n;
}

function firstOpen(config: GameHomeConfig, world: HomeWorld, done: Done) {
  if (!config.isWorldUnlocked(world.id, done)) return null;
  for (let l = 1; l <= world.levels; l++) if (!done(world.id, l) && config.isLevelUnlocked(world.id, l, done)) return l;
  return null;
}

/**
 * El nivel para "Seguir jugando": el próximo sin ganar del mundo que jugaste último;
 * si ese mundo está completo, el primero abierto desde ahí en adelante (y si no, desde el principio).
 */
export function nextLevel(config: GameHomeConfig, progress: GameProgress): { world: HomeWorld; level: number } | null {
  const done = doneFor(config, progress);
  let lastAt = -1;
  let start = 0;
  config.worlds.forEach((w, i) => {
    for (let l = 1; l <= w.levels; l++) {
      const r = progress.levels[config.levelKey(w.id, l)];
      if (r && r.at > lastAt) {
        lastAt = r.at;
        start = i;
      }
    }
  });
  const order = [...config.worlds.slice(start), ...config.worlds.slice(0, start)];
  for (const world of order) {
    const level = firstOpen(config, world, done);
    if (level) return { world, level };
  }
  return null;
}

/** Apertura de mundos y niveles, igual para todos los juegos (games/*\/data.ts en la web). */
export function unlockRules(worlds: HomeWorld[]) {
  const isWorldUnlocked = (worldId: number, done: Done) => {
    const index = worlds.findIndex((w) => w.id === worldId);
    if (index < 0) return false;
    const world = worlds[index];
    if (index === 0 || world.unlockAfter === 0) return true;
    const prev = worlds[index - 1];
    let count = 0;
    for (let n = 1; n <= prev.levels; n++) if (done(prev.id, n)) count++;
    return count >= world.unlockAfter;
  };
  const isLevelUnlocked = (world: number, level: number, done: Done) => {
    if (!isWorldUnlocked(world, done)) return false;
    return level === 1 || done(world, level - 1) || done(world, level);
  };
  return { isWorldUnlocked, isLevelUnlocked };
}

export const levelKey = (world: number, level: number) => `w${world}-l${level}`;
