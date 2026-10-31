import { PALABRA_WORLDS, unpackPalabra, type PackedPalabraLevel } from "@cranea/core/palabra";
import type { Dictionary } from "@cranea/core/palabra/words";
import packed from "@cranea/core/levels/palabra.json";
import { attemptsText, levelKey, unlockRules, type GameHomeConfig } from "@/components/game-home/types";
import { dayNumber } from "@/lib/format";

export const GAME_ID = "palabra";
export { levelKey };

const LEVELS = packed as PackedPalabraLevel[];

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpackPalabra(found) : null;
}

export const getWorld = (id: number) => PALABRA_WORLDS.find((w) => w.id === id) ?? null;

export function nextLevelOf(world: number, level: number) {
  return LEVELS.some((l) => l.w === world && l.n === level + 1) ? level + 1 : null;
}

/** Número del diario: cuenta desde el día de lanzamiento (el mismo que la web). */
export const LAUNCH_DATE = "2026-10-31";
export const dailyNumber = (dateKey: string) => dayNumber(LAUNCH_DATE, dateKey);

export const { isWorldUnlocked, isLevelUnlocked } = unlockRules(PALABRA_WORLDS);

/**
 * Las listas (~3000 palabras) se arman la primera vez que se piden, no al abrir la app:
 * `require` en línea para que Metro no las evalúe al inicio.
 */
let dictionary: Dictionary | null = null;
export function getDictionary(): Dictionary {
  if (!dictionary) {
    const words = require("@cranea/core/palabra/words") as typeof import("@cranea/core/palabra/words");
    dictionary = words.loadDictionary();
  }
  return dictionary;
}

export const PALABRA_HOME: GameHomeConfig = {
  id: GAME_ID,
  name: "Palabra",
  pitch: "Adiviná la palabra de cinco letras. Los colores te van guiando.",
  article: "la",
  daily: {
    title: "Palabra del día",
    blurb: "La misma para todos. Seis intentos.",
    href: "/palabra/diario",
    number: dailyNumber,
  },
  worlds: PALABRA_WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => ({ pathname: "/palabra/nivel/[mundo]/[nivel]", params: { mundo: String(w), nivel: String(l) } }),
  howToHref: "/palabra/como-jugar",
  // Tres puntos con hasta 3 intentos, dos con 4, uno con más.
  stars: (r) => (r.attempts <= 3 ? 3 : r.attempts === 4 ? 2 : 1),
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: r.won ? String(r.attempts) : "X" }),
};
