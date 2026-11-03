import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";

/** Ajustes del dispositivo: los mismos que la hoja de Ajustes de la web, más el tema. */
export interface Prefs {
  theme: ThemePreference;
  palette: "classic" | "colorblind";
  text: "normal" | "large";
  motion: "system" | "reduced";
  sound: boolean;
  vibration: boolean;
}

export const DEFAULT_PREFS: Prefs = { theme: "system", palette: "classic", text: "normal", motion: "system", sound: false, vibration: true };

interface PrefsState extends Prefs {
  hydrated: boolean;
  set: (patch: Partial<Prefs>) => void;
}

/** Clave anterior del tema (antes de Ajustes): se lee una vez para no perder lo elegido. */
const LEGACY_THEME_KEY = "cranea-theme";

export const usePrefs = create<PrefsState>()(
  persist(
    (set): PrefsState => ({ ...DEFAULT_PREFS, hydrated: false, set: (patch) => set(patch) }),
    {
      name: "cranea-prefs",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ theme, palette, text, motion, sound, vibration }) => ({ theme, palette, text, motion, sound, vibration }),
      onRehydrateStorage: () => (state) => {
        const done = () => usePrefs.setState({ hydrated: true });
        if (state && state.theme !== DEFAULT_PREFS.theme) return done();
        AsyncStorage.getItem(LEGACY_THEME_KEY)
          .then((v) => {
            if (v === "light" || v === "dark") usePrefs.setState({ theme: v });
          })
          .catch(() => {})
          .finally(done);
      },
    },
  ),
);

/** Lectura fuera de React (sonido, vibración). */
export const getPrefs = (): Prefs => usePrefs.getState();
