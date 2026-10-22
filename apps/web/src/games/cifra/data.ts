import { unpack, WORLDS, type PackedLevel } from "@cranea/core/cifra";
import packed from "@cranea/core/levels/cifra.json";

const LEVELS = packed as PackedLevel[];

export const levelKey = (world: number, level: number) => `w${world}-l${level}`;

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpack(found) : null;
}

export const getWorld = (id: number) => WORLDS.find((w) => w.id === id) ?? null;

export const allLevelParams = () => LEVELS.map((l) => ({ mundo: String(l.w), nivel: String(l.n) }));

/** Número del diario: cuenta desde el día de lanzamiento. */
export const LAUNCH_DATE = "2026-10-22";
export function dailyNumber(dateKey: string) {
  const ms = Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${LAUNCH_DATE}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}

export function isWorldUnlocked(worldId: number, done: (w: number, l: number) => boolean) {
  const world = getWorld(worldId);
  if (!world || worldId === 1) return true;
  const prev = getWorld(worldId - 1)!;
  let count = 0;
  for (let n = 1; n <= prev.levels; n++) if (done(prev.id, n)) count++;
  return count >= world.unlockAfter;
}

export function isLevelUnlocked(world: number, level: number, done: (w: number, l: number) => boolean) {
  if (!isWorldUnlocked(world, done)) return false;
  return level === 1 || done(world, level - 1) || done(world, level);
}
