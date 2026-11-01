import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayKey } from "@cranea/core";
import {
  emptyProtectors,
  mergeProtectors,
  playedDays,
  protectedBestStreak,
  protectedStreak,
  protectorStatus,
  sameProtectors,
  type ProtectorState,
  type ProtectorStatus,
} from "@cranea/core/protectors";
import { better, combine, type Kind, type Result } from "../../../web/convex/results";

/**
 * Progreso de todos los juegos. Mismo formato, clave (`cranea-progress`) y versión que la web
 * (apps/web/src/stores/progress.ts), así la sincronización con la cuenta es idéntica.
 * Las reglas de combinación vienen del backend (convex/results.ts), compartidas con el servidor.
 */

export type { Kind, ProtectorState, ProtectorStatus, Result };

export interface GameProgress {
  levels: Record<string, Result>;
  daily: Record<string, Result>;
}

interface ProgressState {
  games: Record<string, GameProgress>;
  /** Protector de racha (`@cranea/core/protectors`). Opcional: el formato sigue siendo la versión 1. */
  protectors?: ProtectorState;
  /** true cuando ya se leyó lo guardado en el dispositivo. No se persiste. */
  hydrated: boolean;
  recordLevel: (gameId: string, key: string, r: Result) => void;
  recordDaily: (gameId: string, date: string, r: Result) => void;
  /** Combina partidas de la cuenta con las del dispositivo. */
  mergeEntries: (entries: { gameId: string; kind: Kind; key: string; result: Result }[]) => void;
  /** Combina (o crea, con `today`) el estado de los protectores. */
  mergeProtectors: (p: ProtectorState | undefined, today?: string) => void;
  reset: () => void;
}

const empty = (): GameProgress => ({ levels: {}, daily: {} });

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      games: {},
      hydrated: false,
      recordLevel: (gameId, key, r) =>
        set((s) => {
          const g = s.games[gameId] ?? empty();
          return { games: { ...s.games, [gameId]: { ...g, levels: { ...g.levels, [key]: better(g.levels[key], r) } } } };
        }),
      recordDaily: (gameId, date, r) =>
        set((s) => {
          const g = s.games[gameId] ?? empty();
          // El diario se juega una sola vez: solo un intento extra ganado reemplaza a la derrota (`first`).
          const next = combine("daily", g.daily[date], r);
          if (next === g.daily[date]) return s;
          return { games: { ...s.games, [gameId]: { ...g, daily: { ...g.daily, [date]: next } } } };
        }),
      mergeEntries: (entries) =>
        set((s) => {
          let games = s.games;
          for (const { gameId, kind, key, result } of entries) {
            const g = games[gameId] ?? empty();
            const field = kind === "level" ? "levels" : "daily";
            const next = combine(kind, g[field][key], result);
            if (next === g[field][key]) continue;
            games = { ...games, [gameId]: { ...g, [field]: { ...g[field], [key]: next } } };
          }
          return games === s.games ? s : { games };
        }),
      mergeProtectors: (p, today) =>
        set((s) => {
          const next = mergeProtectors(s.protectors, p) ?? (today ? emptyProtectors(today) : undefined);
          return sameProtectors(next, s.protectors) ? s : { protectors: next };
        }),
      reset: () => set({ games: {}, protectors: undefined }),
    }),
    {
      name: "cranea-progress",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Se guarda lo mismo que en la web: `{ state: { games, protectors? }, version: 1 }`.
      partialize: (s) => ({ games: s.games, protectors: s.protectors }),
      onRehydrateStorage: () => () => useProgress.setState({ hydrated: true }),
    },
  ),
);

const EMPTY: GameProgress = empty();
export const useGameProgress = (gameId: string) => useProgress((s) => s.games[gameId]) ?? EMPTY;

/** Stock y días cubiertos por protectores, calculados desde el progreso (con caché por referencia). */
let cache: { games: unknown; protectors: unknown; today: string; status: ProtectorStatus; covered: Set<string> } | null = null;
export function protectorsOf(s: Pick<ProgressState, "games" | "protectors">, today = todayKey()) {
  if (cache && cache.games === s.games && cache.protectors === s.protectors && cache.today === today) return cache;
  const status = protectorStatus(s.protectors, playedDays(s.games), today);
  cache = { games: s.games, protectors: s.protectors, today, status, covered: new Set(status.covered) };
  return cache;
}

/** Días cubiertos por un protector según el progreso del dispositivo. */
export const coveredDays = (today = todayKey()) => protectorsOf(useProgress.getState(), today).covered;

/**
 * Racha de diarios ganados seguidos, contando hasta hoy (o ayer si hoy todavía no jugaste).
 * Los días cubiertos por un protector puentean la racha sin sumar.
 */
export function dailyStreak(daily: Record<string, Result>, today: string, covered: ReadonlySet<string> = coveredDays()): number {
  return protectedStreak(daily, today, covered);
}

/** La racha más larga de diarios ganados en días seguidos (con los días cubiertos como puente). */
export function bestStreak(daily: Record<string, Result>, covered: ReadonlySet<string> = coveredDays()): number {
  return protectedBestStreak(daily, covered);
}

export interface GameStats {
  played: number;
  won: number;
  streak: number;
  bestStreak: number;
  /** Diarios ganados según los intentos que llevaron; `lost` cuenta los que no salieron. */
  attempts: { counts: Record<number, number>; lost: number };
  avgTimeMs: number | null;
  bestTimeMs: number | null;
  levelsCompleted: number;
}

/** Estadísticas de un juego a partir del progreso del dispositivo (mismo cálculo que la web). */
export function gameStats(g: GameProgress, today: string): GameStats {
  const levels = Object.values(g.levels);
  const daily = Object.values(g.daily);
  const all = [...levels, ...daily];
  const times = all.filter((r) => r.won).map((r) => r.timeMs);
  const counts: Record<number, number> = {};
  for (const r of daily) if (r.won) counts[r.attempts] = (counts[r.attempts] ?? 0) + 1;
  return {
    played: all.length,
    won: all.filter((r) => r.won).length,
    streak: dailyStreak(g.daily, today),
    bestStreak: bestStreak(g.daily),
    attempts: { counts, lost: daily.filter((r) => !r.won).length },
    avgTimeMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
    bestTimeMs: times.length ? Math.min(...times) : null,
    levelsCompleted: levels.filter((r) => r.won).length,
  };
}
