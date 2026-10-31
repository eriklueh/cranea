import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { dark, light, type Palette } from "./tokens";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeValue {
  colors: Palette;
  scheme: "light" | "dark";
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const KEY = "cranea-theme";
const ThemeContext = createContext<ThemeValue | null>(null);

/** Tema claro (cuaderno) u oscuro (pizarrón). Sigue al sistema salvo que elijas uno. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setPref(v);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
    return {
      colors: scheme === "dark" ? dark : light,
      scheme,
      preference,
      setPreference: (p) => {
        setPref(p);
        AsyncStorage.setItem(KEY, p).catch(() => {});
      },
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme fuera de ThemeProvider");
  return value;
}
