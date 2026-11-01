import { evaluateAchievements, type WorldSize } from "@cranea/core/achievements";
import { WORLDS as CIFRA } from "@cranea/core/cifra";
import { WORLDS as NONOGRAMA } from "@cranea/core/nonograma";
import { PALABRA_WORLDS as PALABRA } from "@cranea/core/palabra";
import { WORLDS as PUENTES } from "@cranea/core/puentes";
import { WORLDS as TORRES } from "@cranea/core/torres";
import { coveredDays, type GameProgress } from "@/stores/progress";

const sizes = (worlds: WorldSize[]) => worlds.map(({ id, levels }) => ({ id, levels }));

/** Mundos de los juegos en vivo. Al sumar un juego, agregalo acá también. */
export const WORLD_SIZES: Record<string, WorldSize[]> = {
  cifra: sizes(CIFRA),
  puentes: sizes(PUENTES),
  nonograma: sizes(NONOGRAMA),
  palabra: sizes(PALABRA),
  torres: sizes(TORRES),
};

/** Estado de cada logro con el progreso del dispositivo (las rachas cuentan los días cubiertos por un protector). */
export const evaluate = (games: Record<string, GameProgress>, covered: Iterable<string> = coveredDays()) =>
  evaluateAchievements({ games, worlds: WORLD_SIZES, covered });
