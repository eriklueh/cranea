import { unpack, WORLDS, type PackedLevel } from "@cranea/core/puentes";
import packed from "@cranea/core/levels/puentes.json";

const LEVELS = packed as PackedLevel[];

export const GAME_ID = "puentes";

export const levelKey = (world: number, level: number) => `w${world}-l${level}`;

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpack(found) : null;
}

export const getWorld = (id: number) => WORLDS.find((w) => w.id === id) ?? null;

export const allLevelParams = () => LEVELS.map((l) => ({ mundo: String(l.w), nivel: String(l.n) }));

/** Número del diario: cuenta desde el día de lanzamiento de Puentes. */
export const LAUNCH_DATE = "2026-10-31";
export function dailyNumber(dateKey: string) {
  const ms = Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${LAUNCH_DATE}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}

export function isWorldUnlocked(worldId: number, done: (w: number, l: number) => boolean) {
  const index = WORLDS.findIndex((world) => world.id === worldId);
  if (index < 0) return false;
  const world = WORLDS[index];
  if (index === 0 || world.unlockAfter === 0) return true;
  const prev = WORLDS[index - 1];
  let count = 0;
  for (let n = 1; n <= prev.levels; n++) if (done(prev.id, n)) count++;
  return count >= world.unlockAfter;
}

export function isLevelUnlocked(world: number, level: number, done: (w: number, l: number) => boolean) {
  if (!isWorldUnlocked(world, done)) return false;
  return level === 1 || done(world, level - 1) || done(world, level);
}

/** Puntitos del mapa: 3 sin errores, 2 con uno, 1 con más. */
export const starsFor = (attempts: number) => Math.max(1, 4 - attempts);
