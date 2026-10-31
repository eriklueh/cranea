import type { Href } from "expo-router";
import { plural } from "@/lib/format";
import type { GameProgress, Result } from "@/stores/progress";

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
    title: string;
    blurb: string;
    href: Href;
    number: (date: string) => number;
    /** Si hay una partida del diario empezada en el dispositivo. */
    inProgress?: (date: string) => Promise<boolean>;
  };
  worlds: HomeWorld[];
  isWorldUnlocked: (world: number, done: Done) => boolean;
  isLevelUnlocked: (world: number, level: number, done: Done) => boolean;
  /** Si el mundo está cerrado por no tener Craneá Plus (lo agrega GameHome). */
  planLocked?: (world: number) => boolean;
  levelKey: (world: number, level: number) => string;
  levelHref: (world: number, level: number) => Href;
  howToHref?: Href;
  /** Puntitos de un nivel ganado, de 1 a 3. */
  stars: (r: Result) => number;
  resultText: (r: Result) => string;
  resultStat: (r: Result) => { label: string; value: string };
}

/** "en 2 intentos" */
export const attemptsText = (r: Result) => `en ${plural(r.attempts, "intento", "intentos")}`;

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
