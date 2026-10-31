/**
 * Logros: catálogo y evaluación pura a partir del progreso del dispositivo (el mismo formato que
 * `cranea-progress`). No sabe de React ni de almacenamiento: la web (y la futura app) guardan qué
 * se desbloqueó y cuándo.
 */

export interface AchievementResult {
  won: boolean;
  attempts: number;
  timeMs: number;
  /** Cuándo terminó la partida (ms). */
  at: number;
}

export interface AchievementGame {
  /** Clave `w<mundo>-l<nivel>`. */
  levels: Record<string, AchievementResult>;
  /** Clave `YYYY-MM-DD` (UTC). */
  daily: Record<string, AchievementResult>;
}

export interface WorldSize {
  id: number;
  levels: number;
}

export interface AchievementInput {
  games: Record<string, AchievementGame>;
  /** Mundos de cada juego (los juegos con ranking/diario son las claves). */
  worlds: Record<string, WorldSize[]>;
  /** Hora local (0–23) de un instante. Por defecto, la del dispositivo. */
  hour?: (ms: number) => number;
}

/** Ícono simple; cada plataforma lo dibuja a su manera. */
export type AchievementIcon =
  | "calendar" | "flag" | "flame" | "crown" | "sunrise" | "moon" | "zap" | "target" | "sparkles" | "eye"
  | "bridge" | "palette" | "building" | "puzzle" | "map" | "star" | "trophy" | "medal" | "infinity";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: AchievementIcon;
}

export interface AchievementState extends Achievement {
  unlocked: boolean;
  /** Avance hacia `goal` (para los que cuentan). */
  value: number;
  goal: number;
  /** Cuándo se cumplió, según las partidas (null si todavía no). */
  at: number | null;
}

interface Progress {
  value: number;
  goal: number;
  at: number | null;
}

interface Entry {
  gameId: string;
  key: string;
  r: AchievementResult;
}

interface Context {
  daily: Entry[];
  levels: Entry[];
  worlds: Record<string, WorldSize[]>;
  games: Record<string, AchievementGame>;
  hour: (ms: number) => number;
}

/** 3 puntitos en un nivel: sin errores; en Palabra, en tres intentos o menos. */
export function isPerfect(gameId: string, r: AchievementResult): boolean {
  return r.won && (gameId === "palabra" ? r.attempts <= 3 : r.attempts === 1);
}

/** El momento en que se juntaron `goal` partidas (la n-ésima más antigua). */
function count(times: number[], goal: number): Progress {
  const sorted = [...times].sort((a, b) => a - b);
  return { value: Math.min(sorted.length, goal), goal, at: sorted.length >= goal ? sorted[goal - 1] : null };
}

/** Basta con una partida que cumpla. */
const any = (entries: Entry[], test: (e: Entry) => boolean) => count(entries.filter(test).map((e) => e.r.at), 1);

const DAY_MS = 86_400_000;

/** Racha de días (UTC) seguidos con al menos un diario ganado, en cualquier juego. */
function streak(c: Context, goal: number): Progress {
  const firstWin = new Map<string, number>();
  for (const { key, r } of c.daily) if (r.won) firstWin.set(key, Math.min(firstWin.get(key) ?? Infinity, r.at));
  const days = [...firstWin.keys()].sort();
  let best = 0;
  let run = 0;
  let at: number | null = null;
  days.forEach((day, i) => {
    run = i > 0 && Date.parse(`${day}T00:00:00Z`) - Date.parse(`${days[i - 1]}T00:00:00Z`) === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    if (run === goal && at === null) at = firstWin.get(day)!;
  });
  return { value: Math.min(best, goal), goal, at };
}

/** Los diarios de todos los juegos ganados el mismo día. */
function fullDay(c: Context): Progress {
  const goal = Object.keys(c.worlds).length;
  const byDay = new Map<string, number[]>();
  for (const { key, r } of c.daily) if (r.won) byDay.set(key, [...(byDay.get(key) ?? []), r.at]);
  let value = 0;
  let at: number | null = null;
  for (const times of byDay.values()) {
    value = Math.max(value, times.length);
    if (times.length >= goal) at = Math.min(at ?? Infinity, Math.max(...times));
  }
  return { value: Math.min(value, goal), goal, at };
}

/**
 * Un mundo entero ganado (o con 3 puntitos). Avance: el mundo más cerca de completarse.
 * `at`: cuando se ganó el último nivel del primer mundo que se completó.
 */
function world(c: Context, test: (gameId: string, r: AchievementResult) => boolean): Progress {
  let best = { value: 0, goal: 1, ratio: -1 };
  let at: number | null = null;
  for (const [gameId, worlds] of Object.entries(c.worlds)) {
    const levels = c.games[gameId]?.levels ?? {};
    for (const w of worlds) {
      const times: number[] = [];
      for (let l = 1; l <= w.levels; l++) {
        const r = levels[`w${w.id}-l${l}`];
        if (r && test(gameId, r)) times.push(r.at);
      }
      const ratio = times.length / w.levels;
      if (ratio > best.ratio) best = { value: times.length, goal: w.levels, ratio };
      if (times.length === w.levels && w.levels > 0) at = Math.min(at ?? Infinity, Math.max(...times));
    }
  }
  return at !== null ? { value: 1, goal: 1, at } : { value: best.value, goal: best.goal, at: null };
}

/** Todos los mundos de un juego. */
function wholeGame(c: Context): Progress {
  let best = { value: 0, goal: 1, ratio: -1 };
  let at: number | null = null;
  for (const [gameId, worlds] of Object.entries(c.worlds)) {
    const levels = c.games[gameId]?.levels ?? {};
    const total = worlds.reduce((n, w) => n + w.levels, 0);
    const times = worlds.flatMap((w) =>
      Array.from({ length: w.levels }, (_, i) => levels[`w${w.id}-l${i + 1}`]).filter((r) => r?.won).map((r) => r!.at),
    );
    const ratio = total ? times.length / total : 0;
    if (ratio > best.ratio) best = { value: times.length, goal: total, ratio };
    if (total && times.length === total) at = Math.min(at ?? Infinity, Math.max(...times));
  }
  return at !== null ? { value: 1, goal: 1, at } : { value: best.value, goal: best.goal, at: null };
}

/** Al menos una partida ganada en cada juego. */
function everyGame(c: Context): Progress {
  const games = Object.keys(c.worlds);
  const firsts = games.map((g) => {
    const wins = [...c.daily, ...c.levels].filter((e) => e.gameId === g && e.r.won).map((e) => e.r.at);
    return wins.length ? Math.min(...wins) : null;
  });
  const done = firsts.filter((t): t is number => t !== null);
  return { value: done.length, goal: games.length, at: done.length === games.length ? Math.max(...done) : null };
}

const wonDaily = (c: Context) => c.daily.filter((e) => e.r.won);
const wonLevels = (c: Context) => c.levels.filter((e) => e.r.won);

interface Definition extends Achievement {
  check: (c: Context) => Progress;
}

const DEFINITIONS: Definition[] = [
  { id: "primer-diario", name: "Primera vez", description: "Jugá tu primer diario.", icon: "calendar", check: (c) => count(c.daily.map((e) => e.r.at), 1) },
  { id: "primer-nivel", name: "Arrancamos", description: "Ganá tu primer nivel.", icon: "flag", check: (c) => count(wonLevels(c).map((e) => e.r.at), 1) },
  { id: "de-todo-un-poco", name: "De todo un poco", description: "Ganá una partida en cada juego.", icon: "puzzle", check: everyGame },
  { id: "racha-7", name: "Semana redonda", description: "Ganá algún diario 7 días seguidos.", icon: "flame", check: (c) => streak(c, 7) },
  { id: "racha-30", name: "Un mes sin faltar", description: "Ganá algún diario 30 días seguidos.", icon: "flame", check: (c) => streak(c, 30) },
  { id: "racha-100", name: "Centenario", description: "Ganá algún diario 100 días seguidos.", icon: "crown", check: (c) => streak(c, 100) },
  { id: "pleno", name: "Pleno", description: "Ganá los 5 diarios el mismo día.", icon: "medal", check: fullDay },
  { id: "diarios-30", name: "Habitué", description: "Ganá 30 diarios.", icon: "calendar", check: (c) => count(wonDaily(c).map((e) => e.r.at), 30) },
  { id: "diarios-100", name: "De la casa", description: "Ganá 100 diarios.", icon: "infinity", check: (c) => count(wonDaily(c).map((e) => e.r.at), 100) },
  { id: "madrugador", name: "Madrugador", description: "Terminá un diario entre las 5 y las 8 de la mañana.", icon: "sunrise", check: (c) => any(c.daily, (e) => { const h = c.hour(e.r.at); return h >= 5 && h < 8; }) },
  { id: "buho", name: "Búho", description: "Terminá un diario entre la medianoche y las 5.", icon: "moon", check: (c) => any(c.daily, (e) => c.hour(e.r.at) < 5) },
  { id: "rayo", name: "Rayo", description: "Resolvé un diario en menos de un minuto.", icon: "zap", check: (c) => any(c.daily, (e) => e.r.won && e.r.timeMs < 60_000) },
  { id: "palabra-2", name: "Puntería", description: "Adiviná una Palabra en 2 intentos o menos.", icon: "target", check: (c) => any([...c.daily, ...c.levels], (e) => e.gameId === "palabra" && e.r.won && e.r.attempts <= 2) },
  { id: "palabra-1", name: "Adivino", description: "Adiviná una Palabra al primer intento.", icon: "sparkles", check: (c) => any([...c.daily, ...c.levels], (e) => e.gameId === "palabra" && e.r.won && e.r.attempts === 1) },
  { id: "cifra-1", name: "Ojo de lince", description: "Descubrí el diario de Cifra al primer intento.", icon: "eye", check: (c) => any(c.daily, (e) => e.gameId === "cifra" && e.r.won && e.r.attempts === 1) },
  { id: "torres-limpio", name: "Vista de águila", description: "Resolvé el diario de Torres sin errores.", icon: "building", check: (c) => any(c.daily, (e) => e.gameId === "torres" && e.r.won && e.r.attempts === 1) },
  { id: "puentes-10", name: "Ingeniería", description: "Ganá 10 niveles de Puentes sin errores.", icon: "bridge", check: (c) => count(c.levels.filter((e) => e.gameId === "puentes" && e.r.won && e.r.attempts === 1).map((e) => e.r.at), 10) },
  { id: "artista", name: "Artista", description: "Pintá 10 dibujos del Nonograma.", icon: "palette", check: (c) => count(c.levels.filter((e) => e.gameId === "nonograma" && e.r.won).map((e) => e.r.at), 10) },
  { id: "niveles-50", name: "Medio centenar", description: "Ganá 50 niveles.", icon: "trophy", check: (c) => count(wonLevels(c).map((e) => e.r.at), 50) },
  { id: "niveles-200", name: "Incansable", description: "Ganá 200 niveles.", icon: "trophy", check: (c) => count(wonLevels(c).map((e) => e.r.at), 200) },
  { id: "mundo-completo", name: "Mundo completo", description: "Ganá todos los niveles de un mundo.", icon: "map", check: (c) => world(c, (_, r) => r.won) },
  { id: "mundo-perfecto", name: "Sin un rayón", description: "Completá un mundo con 3 puntitos en cada nivel.", icon: "star", check: (c) => world(c, isPerfect) },
  { id: "leyenda", name: "Leyenda", description: "Completá todos los mundos de un juego.", icon: "crown", check: wholeGame },
];

/** Catálogo, en el orden en que se muestra. */
export const ACHIEVEMENTS: Achievement[] = DEFINITIONS.map(({ check: _, ...a }) => a);

function entries(games: Record<string, AchievementGame>, field: "levels" | "daily"): Entry[] {
  return Object.entries(games).flatMap(([gameId, g]) => Object.entries(g?.[field] ?? {}).map(([key, r]) => ({ gameId, key, r })));
}

/** Estado de cada logro según el progreso. Pura: mismo progreso, mismo resultado. */
export function evaluateAchievements({ games, worlds, hour = (ms) => new Date(ms).getHours() }: AchievementInput): AchievementState[] {
  const c: Context = { daily: entries(games, "daily"), levels: entries(games, "levels"), worlds, games, hour };
  return DEFINITIONS.map(({ check, ...a }) => {
    const p = check(c);
    return { ...a, ...p, unlocked: p.at !== null };
  });
}
