import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Pistas gratis ya vistas por tablero (como `cranea-pistas:<id>` en la web), guardadas en el
 * dispositivo: no se borran al reintentar ni al salir. `seen` son claves de `hintKey` (core);
 * `bonus`, pistas ganadas con un anuncio en ese tablero.
 */

/** Se recuerdan los tableros más recientes; los diarios viejos se van solos. */
const KEEP = 200;

interface HintLedger {
  seen: Record<string, number[]>;
  bonus: Record<string, number>;
  add: (id: string, key: number) => void;
  grant: (id: string) => void;
}

const trim = <T,>(o: Record<string, T>, id: string) => {
  const keys = Object.keys(o).filter((k) => k !== id);
  return Object.fromEntries(keys.slice(Math.max(0, keys.length - KEEP + 1)).map((k) => [k, o[k]])) as Record<string, T>;
};

export const useNonogramaHints = create<HintLedger>()(
  persist(
    (set) => ({
      seen: {},
      bonus: {},
      add: (id, key) => set((s) => ({ seen: { ...trim(s.seen, id), [id]: [...new Set([...(s.seen[id] ?? []), key])] } })),
      grant: (id) => set((s) => ({ bonus: { ...trim(s.bonus, id), [id]: (s.bonus[id] ?? 0) + 1 } })),
    }),
    { name: "cranea-nonograma-pistas", version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);
