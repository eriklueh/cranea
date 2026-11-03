import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { usePrefs, type ThemePreference } from "@/lib/prefs";
import { colorblind, dark, LARGE_TEXT_SCALE, light, type Palette } from "./tokens";

export type { ThemePreference };

interface ThemeValue {
  colors: Palette;
  scheme: "light" | "dark";
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** Multiplicador del texto de lectura (Ajustes > Tamaño de letra). */
  textScale: number;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Tema claro (cuaderno) u oscuro (pizarrón), paleta de las pistas y tamaño de letra, según Ajustes
 * (`usePrefs`). El layout raíz espera a que los ajustes estén leídos antes del primer cuadro.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const preference = usePrefs((s) => s.theme);
  const palette = usePrefs((s) => s.palette);
  const text = usePrefs((s) => s.text);

  const value = useMemo<ThemeValue>(() => {
    const scheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
    const base = scheme === "dark" ? dark : light;
    return {
      colors: palette === "colorblind" ? { ...base, ...colorblind[scheme] } : base,
      scheme,
      preference,
      setPreference: (theme) => usePrefs.getState().set({ theme }),
      textScale: text === "large" ? LARGE_TEXT_SCALE : 1,
    };
  }, [preference, system, palette, text]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme fuera de ThemeProvider");
  return value;
}
