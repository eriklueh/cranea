import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { better, combine, type Kind, type Result } from "../../../web/convex/results";

/**
 * Progreso de todos los juegos. Mismo formato, clave (`cranea-progress`) y versión que la web
 * (apps/web/src/stores/progress.ts), así la sincronización con la cuenta es idéntica.
 * Las reglas de combinación vienen del backend (convex/results.ts), compartidas con el servidor.
 */

export type { Kind, Result };

export interface GameProgress {
  levels: Record<string, Result>;
  daily: Record<string, Result>;
}

interface ProgressState {
  games: Record<string, GameProgress>;
  /** true cuando ya se leyó lo guardado en el dispositivo. No se persiste. */
  hydrated: boolean;
  recordLevel: (gameId: string, key: string, r: Result) => void;
  recordDaily: (gameId: string, date: string, r: Result) => void;
  /** Combina partidas de la cuenta con las del dispositivo. */
  mergeEntries: (entries: { gameId: string; kind: Kind; key: string; result: Result }[]) => void;
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
          if (g.daily[date]) return s; // el diario se juega una sola vez
          return { games: { ...s.games, [gameId]: { ...g, daily: { ...g.daily, [date]: r } } } };
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
      reset: () => set({ games: {} }),
    }),
    {
      name: "cranea-progress",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Solo se guarda `games`, igual que en la web: `{ state: { games }, version: 1 }`.
      partialize: (s) => ({ games: s.games }),
      onRehydrateStorage: () => () => useProgress.setState({ hydrated: true }),
    },
  ),
);

const EMPTY: GameProgress = empty();
export const useGameProgress = (gameId: string) => useProgress((s) => s.games[gameId]) ?? EMPTY;

/** Racha de diarios ganados seguidos, contando hasta hoy (o ayer si hoy todavía no jugaste). */
export function dailyStreak(daily: Record<string, Result>, today: string): number {
  const d = new Date(`${today}T00:00:00Z`);
  if (!daily[today]?.won) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (daily[d.toISOString().slice(0, 10)]?.won) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

/** La racha más larga de diarios ganados en días seguidos. */
export function bestStreak(daily: Record<string, Result>): number {
  const days = Object.keys(daily).filter((d) => daily[d].won).map((d) => Date.parse(`${d}T00:00:00Z`)).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] - days[i - 1] === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
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
