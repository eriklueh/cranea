"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Logros desbloqueados en el dispositivo (id → cuándo). Con sesión se sincronizan con la cuenta. */
interface AchievementsState {
  unlocked: Record<string, number>;
  /**
   * false hasta la primera evaluación: lo que ya estaba cumplido antes de que existieran los logros
   * (o al estrenar dispositivo) se desbloquea sin festejo.
   */
  seeded: boolean;
  /** Suma logros; si ya estaban, conserva la fecha más antigua. */
  unlock: (items: { id: string; at: number }[]) => void;
  setSeeded: () => void;
}

export const useAchievements = create<AchievementsState>()(
  persist(
    (set) => ({
      unlocked: {},
      seeded: false,
      unlock: (items) =>
        set((s) => {
          let unlocked = s.unlocked;
          for (const { id, at } of items) {
            if (s.unlocked[id] !== undefined && s.unlocked[id] <= at) continue;
            unlocked = { ...unlocked, [id]: at };
          }
          return unlocked === s.unlocked ? s : { unlocked };
        }),
      setSeeded: () => set({ seeded: true }),
    }),
    { name: "cranea-logros", version: 1 },
  ),
);

/** true cuando ya llegaron los logros de la cuenta (o no hay sesión): recién ahí se festeja lo nuevo. */
export const useAchievementsReady = create<{ ready: boolean }>(() => ({ ready: false }));
