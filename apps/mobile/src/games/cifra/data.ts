import { dailySeed, unpack, WORLDS, type PackedLevel } from "@cranea/core/cifra";
import packed from "@cranea/core/levels/cifra.json";
import { attemptsText, levelKey, unlockRules, type GameHomeConfig } from "@/components/game-home/types";
import { dayNumber } from "@/lib/format";
import { translator } from "@/lib/i18n";
import { hasSession } from "./session";

export const GAME_ID = "cifra";
export const MAX_ATTEMPTS = 3;
export { levelKey };

const LEVELS = packed as PackedLevel[];

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpack(found) : null;
}

export const getWorld = (id: number) => WORLDS.find((w) => w.id === id) ?? null;

/** Número de mundo que ve la gente (1, 2…): los ids internos de Cifra arrancan en 2 por compatibilidad. */
export const displayWorld = (id: number) => WORLDS.findIndex((w) => w.id === id) + 1 || id;

/** Número del diario: cuenta desde el día de lanzamiento (el mismo que la web). */
export const LAUNCH_DATE = "2026-10-22";
export const dailyNumber = (dateKey: string) => dayNumber(LAUNCH_DATE, dateKey);

export const { isWorldUnlocked, isLevelUnlocked } = unlockRules(WORLDS);

/** El nivel que sigue dentro del mismo mundo, o null si era el último. */
export function nextLevelOf(world: number, level: number) {
  return LEVELS.some((l) => l.w === world && l.n === level + 1) ? level + 1 : null;
}

export const CIFRA_HOME: GameHomeConfig = {
  id: GAME_ID,
  name: "Cifra",
  pitch: "Cruzá intentos ya puntuados hasta que solo un código encaje.",
  article: "el",
  daily: {
    title: (locale) => translator(locale)("cifra.dailyTitle"),
    blurb: (locale) => translator(locale)("cifra.dailyBlurb"),
    href: "/cifra/diario",
    number: dailyNumber,
    inProgress: (date) => hasSession(dailySeed(date)),
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => ({ pathname: "/cifra/nivel/[mundo]/[nivel]", params: { mundo: String(w), nivel: String(l) } }),
  howToHref: "/cifra/como-jugar",
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: attemptsText,
  resultStat: (r, locale) => ({ label: translator(locale)("cifra.statAttempts"), value: `${r.attempts}/${MAX_ATTEMPTS}` }),
};
