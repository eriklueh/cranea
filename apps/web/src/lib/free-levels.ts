/**
 * Qué niveles son gratis sin Craneá Plus: los primeros `FREE_LEVELS` del primer mundo de cada juego.
 * El mismo número que la app (`apps/mobile/src/entitlements`). Puro: lo usan también las páginas del servidor.
 */
export const FREE_LEVELS = 3;

export function isFreeLevel(worlds: readonly { id: number }[], worldId: number, level: number) {
  return worlds.length > 0 && worlds[0].id === worldId && level >= 1 && level <= FREE_LEVELS;
}

/** Cuántos niveles de un juego se abren con Plus (todos menos los gratis). */
export const plusLevelCount = (worlds: readonly { levels: number }[]) =>
  Math.max(0, worlds.reduce((n, w) => n + w.levels, 0) - Math.min(FREE_LEVELS, worlds[0]?.levels ?? 0));
