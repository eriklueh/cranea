import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Punto único para saber si la persona tiene Craneá Plus. Las pantallas preguntan `usePlus()` o
 * `can(...)`, nunca a la tienda directamente.
 *
 * Gratis: los desafíos del día, cómo se juega, ranking, estadísticas y los primeros `FREE_LEVELS`
 * niveles del primer mundo de cada juego (igual que la web, `lib/plus.ts`).
 * Plus (entitlement "plus" de RevenueCat): todos los niveles, archivo de diarios, pistas sin límite y
 * sin anuncios. Hay Plus si lo dice RevenueCat en el dispositivo **o** Convex (`entitlements.mine`,
 * escrito por el webhook o a mano): así vale también lo comprado en otro dispositivo o regalado.
 * Lo último que se supo queda guardado para jugar sin conexión.
 */

export type Feature = "all-worlds" | "archive" | "unlimited-hints" | "no-ads";

/** Niveles gratis de cada juego: los primeros del primer mundo. El mismo número que la web (`lib/plus.ts`). */
export const FREE_LEVELS = 3;
/** Pistas gratis por tablero (diario o nivel). Con un anuncio se gana una más. */
export const FREE_HINTS = 1;

/** Sin conexión, una suscripción vencida se sigue respetando unos días: la renovación puede no haber llegado. */
const OFFLINE_GRACE_MS = 3 * 86_400_000;

export interface Source {
  active: boolean;
  /** Vencimiento (ms) o null si no vence. */
  until: number | null;
}

interface PlusState {
  /** Cuenta de Clerk a la que pertenece lo guardado. Sin cuenta no hay Plus. */
  owner: string | null;
  /** RevenueCat (customerInfo del dispositivo). */
  store: Source | null;
  /** Convex (`entitlements.mine`). */
  server: Source | null;
  /** Dónde gestionar la suscripción (lo da RevenueCat). */
  managementURL: string | null;
  /** true cuando ya se leyó lo guardado. No se persiste. */
  hydrated: boolean;
  setOwner: (owner: string | null) => void;
  setStore: (store: Source, managementURL: string | null) => void;
  setServer: (server: Source) => void;
}

export const usePlusState = create<PlusState>()(
  persist(
    (set, get) => ({
      owner: null,
      store: null,
      server: null,
      managementURL: null,
      hydrated: false,
      setOwner: (owner) => {
        if (get().owner !== owner) set({ owner, store: null, server: null, managementURL: null });
      },
      setStore: (store, managementURL) => set({ store, managementURL }),
      setServer: (server) => set({ server }),
    }),
    {
      name: "cranea-plus",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ owner, store, server, managementURL }) => ({ owner, store, server, managementURL }),
      onRehydrateStorage: () => () => usePlusState.setState({ hydrated: true }),
    },
  ),
);

const valid = (s: Source | null, now: number) => Boolean(s?.active && (s.until === null || s.until + OFFLINE_GRACE_MS > now));

export function isPlus(s: Pick<PlusState, "owner" | "store" | "server">, now = Date.now()) {
  return Boolean(s.owner) && (valid(s.store, now) || valid(s.server, now));
}

/** Si la persona tiene Craneá Plus (se actualiza solo). */
export const usePlus = () => usePlusState((s) => isPlus(s));

/** true cuando ya se sabe si hay Plus (lo guardado se leyó), para no mostrar un candado de más. */
export const usePlusReady = () => usePlusState((s) => s.hydrated);

/** Qué funciones son de Plus. Lo que no está acá es gratis. */
const PLUS_ONLY: ReadonlySet<Feature> = new Set(["all-worlds", "archive", "unlimited-hints", "no-ads"]);

export function can(feature: Feature, plus = isPlus(usePlusState.getState())) {
  return plus || !PLUS_ONLY.has(feature);
}

/** Si un nivel se juega gratis: los primeros `FREE_LEVELS` del primer mundo del mapa. */
export function isFreeLevel(worlds: readonly { id: number }[], worldId: number, level: number) {
  return worlds.length > 0 && worlds[0].id === worldId && level >= 1 && level <= FREE_LEVELS;
}

/** Si el mundo entero es de Plus (no tiene ningún nivel gratis). */
export const isPlusWorld = (worlds: readonly { id: number }[], worldId: number) => !isFreeLevel(worlds, worldId, 1);

/** Cuántos niveles de un juego se abren con Plus (todos menos los gratis). */
export const plusLevelCount = (worlds: readonly { levels: number }[]) =>
  Math.max(0, worlds.reduce((n, w) => n + w.levels, 0) - Math.min(FREE_LEVELS, worlds[0]?.levels ?? 0));
