import { unpackPalabra, type PackedPalabraLevel } from "@cranea/core/palabra";
import packed from "@cranea/core/levels/palabra.json";

const LEVELS = packed as PackedPalabraLevel[];

export function getLevel(world: number, level: number) {
  const found = LEVELS.find((l) => l.w === world && l.n === level);
  return found ? unpackPalabra(found) : null;
}

export const allLevelParams = () => LEVELS.map((l) => ({ mundo: String(l.w), nivel: String(l.n) }));
