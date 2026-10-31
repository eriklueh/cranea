import { normalizeWord } from "./normalize";
import { pickAnswer } from "./generator";
import type { PalabraConfig, PalabraPuzzle } from "./types";
import type { Dictionary } from "./words";

export interface PalabraWorld extends PalabraConfig {
  id: number;
  name: string;
  description: string;
  levels: number;
  /** Niveles del mundo anterior que hay que completar para abrirlo. */
  unlockAfter: number;
}

/** Como Wordle: la palabra se descubre probando. Cada mundo da menos margen. */
export const PALABRA_WORLDS: PalabraWorld[] = [
  { id: 1, name: "Seis intentos", description: "Probá palabras y usá los colores para acercarte.", attempts: 6, hard: false, levels: 24, unlockAfter: 0 },
  { id: 2, name: "Cinco intentos", description: "Un intento menos: cada palabra tiene que descartar más.", attempts: 5, hard: false, levels: 24, unlockAfter: 8 },
  { id: 3, name: "Cuatro intentos", description: "Poco margen. Elegí bien la primera palabra.", attempts: 4, hard: false, levels: 24, unlockAfter: 8 },
  { id: 4, name: "Modo difícil", description: "Lo que descubrís lo tenés que usar en el intento siguiente.", attempts: 5, hard: true, levels: 24, unlockAfter: 8 },
];

export const PALABRA_DAILY_CONFIG: PalabraConfig = { attempts: 6, hard: false };

export const palabraLevelSeed = (world: number, level: number) => `palabra:w${world}:l${level}`;
export const palabraDailySeed = (dateKey: string) => `palabra:daily:${dateKey}`;

/** Niveles pregenerados: solo la respuesta (con tildes). */
export interface PackedPalabraLevel {
  w: number;
  n: number;
  a: string;
}

export const packPalabra = (w: number, n: number, p: PalabraPuzzle): PackedPalabraLevel => ({ w, n, a: p.display });

export function unpackPalabra(l: PackedPalabraLevel): PalabraPuzzle {
  const world = PALABRA_WORLDS.find((x) => x.id === l.w) ?? PALABRA_WORLDS[0];
  return { id: palabraLevelSeed(l.w, l.n), answer: normalizeWord(l.a), display: l.a, attempts: world.attempts, hard: world.hard };
}

const puzzle = (id: string, answer: string, cfg: PalabraConfig, dict: Dictionary): PalabraPuzzle => ({
  id,
  answer,
  display: dict.display.get(answer) ?? answer,
  attempts: cfg.attempts,
  hard: cfg.hard,
});

export const generatePalabraLevel = (world: PalabraWorld, level: number, dict: Dictionary, used?: ReadonlySet<string>) =>
  puzzle(palabraLevelSeed(world.id, level), pickAnswer(palabraLevelSeed(world.id, level), dict, used), world, dict);

/** El diario se elige en el cliente con la fecha UTC como semilla: todos tienen la misma palabra. */
export const generatePalabraDaily = (dateKey: string, dict: Dictionary) =>
  puzzle(palabraDailySeed(dateKey), pickAnswer(palabraDailySeed(dateKey), dict), PALABRA_DAILY_CONFIG, dict);
