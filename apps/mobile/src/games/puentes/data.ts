import { unpack, WORLDS, type PackedLevel } from "@cranea/core/puentes";
import packed from "@cranea/core/levels/puentes.json";
import { levelKey, unlockRules, type GameHomeConfig } from "@/components/game-home/types";
import { dayNumber } from "@/lib/format";
import { translator, type T } from "@/lib/i18n";

/** Mismo id, claves de nivel (`w2-l5`) y de diario (`2026-10-31`) que la web (apps/web/src/games/puentes/data.ts). */
export const GAME_ID = "puentes";
export { levelKey };

const LEVELS = packed as PackedLevel[];

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpack(found) : null;
}

export const getWorld = (id: number) => WORLDS.find((w) => w.id === id) ?? null;

export function nextLevelOf(world: number, level: number) {
  return LEVELS.some((l) => l.w === world && l.n === level + 1) ? level + 1 : null;
}

/** Número del diario: cuenta desde el día de lanzamiento de Puentes (el mismo que la web). */
export const LAUNCH_DATE = "2026-10-31";
export const dailyNumber = (dateKey: string) => dayNumber(LAUNCH_DATE, dateKey);

export const { isWorldUnlocked, isLevelUnlocked } = unlockRules(WORLDS);

/** Puntitos del mapa: 3 sin errores, 2 con uno, 1 con más. */
export const starsFor = (attempts: number) => Math.max(1, 4 - attempts);

/** "sin errores", "con 2 errores" / "no mistakes", "2 mistakes". */
export const mistakesText = (n: number, t: T) => (n === 0 ? t("puentes.noMistakes") : t("puentes.withMistakes", { count: n }));

export const PUENTES_HOME: GameHomeConfig = {
  id: GAME_ID,
  name: "Puentes",
  pitch: "Uní todas las islas con puentes rectos, sin cruzarlos.",
  article: "el",
  daily: {
    title: (locale) => translator(locale)("puentes.dailyTitle"),
    blurb: (locale) => translator(locale)("puentes.dailyBlurb"),
    href: "/puentes/diario",
    number: dailyNumber,
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => ({ pathname: "/puentes/nivel/[mundo]/[nivel]", params: { mundo: String(w), nivel: String(l) } }),
  howToHref: "/puentes/como-jugar",
  stars: (r) => starsFor(r.attempts),
  resultText: (r, locale) => mistakesText(r.attempts - 1, translator(locale)),
  resultStat: (r, locale) => ({ label: translator(locale)("puentes.statMistakes"), value: String(r.attempts - 1) }),
};
