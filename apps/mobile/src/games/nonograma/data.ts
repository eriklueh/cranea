import { unpack, WORLDS, type PackedLevel } from "@cranea/core/nonograma";
import packed from "@cranea/core/levels/nonograma.json";
import { createElement } from "react";
import { attemptsText, levelKey, unlockRules, type GameHomeConfig } from "@/components/game-home/types";
import { dayNumber } from "@/lib/format";
import { PixelArtThumb } from "./components/pixel-art";

/** Mismas claves que la web (apps/web/src/games/nonograma/data.ts): `nonograma`, `w2-l5`, `2026-10-31`. */
export const GAME_ID = "nonograma";
export { levelKey };

const LEVELS = packed as PackedLevel[];

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpack(found) : null;
}

/** Dibujo de un nivel, para las miniaturas del mapa (sin armar el puzzle entero). */
export const levelRows = (world: number, level: number) => LEVELS.find((l) => l.w === world && l.n === level)?.r ?? null;

export const levelTitle = (world: number, level: number) => LEVELS.find((l) => l.w === world && l.n === level)?.t ?? "";

export const getWorld = (id: number) => WORLDS.find((w) => w.id === id) ?? null;

/** Igual que la web: el siguiente del mundo o, al terminarlo, el primero del mundo siguiente. */
export function nextLevelOf(world: number, level: number): { world: number; level: number } | null {
  if (LEVELS.some((l) => l.w === world && l.n === level + 1)) return { world, level: level + 1 };
  if (LEVELS.some((l) => l.w === world + 1 && l.n === 1)) return { world: world + 1, level: 1 };
  return null;
}

/** Número del diario: cuenta desde el día de lanzamiento (el mismo que la web). */
export const LAUNCH_DATE = "2026-10-31";
export const dailyNumber = (dateKey: string) => Math.max(1, dayNumber(LAUNCH_DATE, dateKey));

export const { isWorldUnlocked, isLevelUnlocked } = unlockRules(WORLDS);

/** Intentos = 1 + revisiones usadas. Con dos revisiones se llega al máximo de tres (DAILY_MAX_ATTEMPTS). */
export const MAX_ATTEMPTS = 3;
export const MAX_CHECKS = MAX_ATTEMPTS - 1;

export const NONOGRAMA_HOME: GameHomeConfig = {
  id: GAME_ID,
  name: "Nonograma",
  pitch: "Pintá casillas siguiendo los números hasta que aparezca el dibujo.",
  article: "el",
  daily: {
    title: "Nonograma del día",
    blurb: "Un 10×10 nuevo, el mismo para todos.",
    href: "/nonograma/diario",
    number: dailyNumber,
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => ({ pathname: "/nonograma/nivel/[mundo]/[nivel]", params: { mundo: String(w), nivel: String(l) } }),
  howToHref: "/nonograma/como-jugar",
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: `${r.attempts}/${MAX_ATTEMPTS}` }),
  // Los niveles resueltos muestran su dibujo en el mapa, como en la web.
  thumbnail: (w, l) => {
    const rows = levelRows(w, l);
    return rows ? createElement(PixelArtThumb, { rows }) : null;
  },
  levelTitle,
};
