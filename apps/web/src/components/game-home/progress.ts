import type { GameProgress } from "@/stores/progress";
import type { Done, GameHomeConfig, HomeWorld } from "./types";

export const doneFor = (config: GameHomeConfig, progress: GameProgress): Done => (w, l) =>
  Boolean(progress.levels[config.levelKey(w, l)]?.won);

export function wonIn(world: HomeWorld, done: Done) {
  let n = 0;
  for (let l = 1; l <= world.levels; l++) if (done(world.id, l)) n++;
  return n;
}

/** Primer nivel abierto y sin ganar de un mundo, o null. */
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

/** Milisegundos hasta la próxima medianoche UTC, cuando cambia el diario. */
export function msToNextDaily(now: number) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - now;
}

/** "5 h 12 min", "12 min", "menos de un minuto" */
export function formatCountdown(ms: number) {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "menos de un minuto";
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")} min` : `${min} min`;
}
