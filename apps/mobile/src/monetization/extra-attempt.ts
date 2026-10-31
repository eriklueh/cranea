import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DAILY_MAX_ATTEMPTS } from "../../../web/convex/results";

/**
 * Un intento más en un diario perdido (con un anuncio, o directo con Plus), una vez por diario.
 * La derrota ya quedó guardada y cerró el intento oficial del ranking. Si el intento extra sale,
 * se guarda un resultado nuevo con `attempts` = los de la derrota + 1, que reemplaza a la derrota
 * para la racha y las estadísticas (`first` en convex/results.ts); el ranking lo sigue contando como
 * no resuelto. Si no sale, no se guarda nada más.
 */

/** Se recuerdan unos días, para no ofrecerlo dos veces el mismo diario. */
const KEEP_DAYS = 3;

interface ExtraState {
  /** `${juego}:${fecha}` → ya se usó (o se vio la solución). */
  used: Record<string, true>;
  markUsed: (gameId: string, date: string) => void;
}

export const useExtraAttempts = create<ExtraState>()(
  persist(
    (set) => ({
      used: {},
      markUsed: (gameId, date) =>
        set((s) => {
          const oldest = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
          const used = Object.fromEntries(Object.entries(s.used).filter(([k]) => k.slice(k.indexOf(":") + 1) >= oldest));
          return { used: { ...used, [`${gameId}:${date}`]: true } };
        }),
    }),
    { name: "cranea-intento-extra", version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** Si un resultado de diario se ganó con el intento extra (más intentos que los permitidos). */
export const isAssisted = (gameId: string, attempts: number) => attempts > (DAILY_MAX_ATTEMPTS[gameId] ?? Infinity);
