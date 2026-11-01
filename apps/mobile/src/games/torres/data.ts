import { dailySeed, unpack, WORLDS, type PackedLevel } from "@cranea/core/torres";
import packed from "@cranea/core/levels/torres.json";
import { attemptsText, levelKey, unlockRules, type GameHomeConfig } from "@/components/game-home/types";
import { dayNumber } from "@/lib/format";
import { hasSession } from "./session";

/** Mismo id, claves de nivel (`w2-l5`) y de diario (`2026-10-31`) que la web (apps/web/src/games/torres/data.ts). */
export const GAME_ID = "torres";
/** Intentos = 1 + comprobaciones fallidas; con 3 fallidas se pierde (DAILY_MAX_ATTEMPTS.torres en convex/results.ts). */
export const MAX_ATTEMPTS = 3;
export { levelKey };

const LEVELS = packed as PackedLevel[];

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpack(found) : null;
}

/** Número del diario: cuenta desde el día de lanzamiento de Torres (el mismo que la web). */
export const LAUNCH_DATE = "2026-10-31";
export const dailyNumber = (dateKey: string) => dayNumber(LAUNCH_DATE, dateKey);

export const { isWorldUnlocked, isLevelUnlocked } = unlockRules(WORLDS);

/** El nivel que sigue dentro del mismo mundo, o null si era el último. */
export function nextLevelOf(world: number, level: number) {
  return LEVELS.some((l) => l.w === world && l.n === level + 1) ? level + 1 : null;
}

export const TORRES_HOME: GameHomeConfig = {
  id: GAME_ID,
  name: "Torres",
  pitch: "Levantá la ciudad: cada borde dice cuántas torres se ven.",
  article: "el",
  daily: {
    title: "Torres del día",
    blurb: "Una ciudad de 5×5, la misma para todos.",
    href: "/torres/diario",
    number: dailyNumber,
    inProgress: (date) => hasSession(dailySeed(date)),
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => ({ pathname: "/torres/nivel/[mundo]/[nivel]", params: { mundo: String(w), nivel: String(l) } }),
  howToHref: "/torres/como-jugar",
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: `${r.attempts}/${MAX_ATTEMPTS}` }),
};
