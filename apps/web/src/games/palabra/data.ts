import { PALABRA_WORLDS } from "@cranea/core/palabra";

/** Ayudas livianas para el cliente. Los niveles (JSON) viven en levels.ts y solo los importan las páginas. */
export const GAME_ID = "palabra";

export const levelKey = (world: number, level: number) => `w${world}-l${level}`;

export const getWorld = (id: number) => PALABRA_WORLDS.find((w) => w.id === id) ?? null;

/** Número del diario: cuenta desde el día de lanzamiento. */
export const LAUNCH_DATE = "2026-10-31";
export function dailyNumber(dateKey: string) {
  const ms = Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${LAUNCH_DATE}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}

export function isWorldUnlocked(worldId: number, done: (w: number, l: number) => boolean) {
  const index = PALABRA_WORLDS.findIndex((world) => world.id === worldId);
  if (index < 0) return false;
  const world = PALABRA_WORLDS[index];
  if (index === 0 || world.unlockAfter === 0) return true;
  const prev = PALABRA_WORLDS[index - 1];
  let count = 0;
  for (let n = 1; n <= prev.levels; n++) if (done(prev.id, n)) count++;
  return count >= world.unlockAfter;
}

export function isLevelUnlocked(world: number, level: number, done: (w: number, l: number) => boolean) {
  if (!isWorldUnlocked(world, done)) return false;
  return level === 1 || done(world, level - 1) || done(world, level);
}
