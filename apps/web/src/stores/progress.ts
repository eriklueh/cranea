"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Progreso de todos los juegos. Vive en el dispositivo (localStorage), sin cuenta. */

export interface Result {
  won: boolean;
  attempts: number;
  timeMs: number;
  at: number;
}

export interface GameProgress {
  levels: Record<string, Result>;
  daily: Record<string, Result>;
}

interface ProgressState {
  games: Record<string, GameProgress>;
  recordLevel: (gameId: string, key: string, r: Result) => void;
  recordDaily: (gameId: string, date: string, r: Result) => void;
  reset: () => void;
}

const empty = (): GameProgress => ({ levels: {}, daily: {} });

const better = (a: Result | undefined, b: Result) => {
  if (!a || !a.won) return b.won || !a ? b : a;
  if (!b.won) return a;
  if (b.attempts !== a.attempts) return b.attempts < a.attempts ? b : a;
  return b.timeMs < a.timeMs ? b : a;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      games: {},
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
      reset: () => set({ games: {} }),
    }),
    { name: "cranea-progress", version: 1 },
  ),
);

export const useGameProgress = (gameId: string) => useProgress((s) => s.games[gameId]) ?? EMPTY;
const EMPTY: GameProgress = empty();

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
