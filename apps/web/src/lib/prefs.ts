"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PREFS_KEY } from "@/lib/prefs-script";

/** Ajustes del dispositivo. Los visuales se reflejan como atributos de <html> (ver prefs-script.ts y globals.css). */
export interface Prefs {
  sound: boolean;
  vibration: boolean;
  motion: "system" | "reduced";
  palette: "classic" | "colorblind";
  text: "normal" | "large";
}

export const DEFAULT_PREFS: Prefs = { sound: false, vibration: true, motion: "system", palette: "classic", text: "normal" };

interface PrefsState extends Prefs {
  set: (patch: Partial<Prefs>) => void;
}

export const usePrefs = create<PrefsState>()(
  persist((set) => ({ ...DEFAULT_PREFS, set: (patch) => set(patch) }), { name: PREFS_KEY, version: 1 }),
);

/** Lectura fuera de React (sonido, vibración). Antes de hidratar el store devuelve lo guardado igual. */
export const getPrefs = (): Prefs => usePrefs.getState();

/** Atributos de <html> para cada ajuste visual; solo se ponen cuando difieren del valor por defecto. */
export function applyPrefs({ motion, palette, text }: Pick<Prefs, "motion" | "palette" | "text">) {
  const root = document.documentElement;
  const toggle = (name: string, value: string | false) => (value ? root.setAttribute(name, value) : root.removeAttribute(name));
  toggle("data-motion", motion === "reduced" && "reduced");
  toggle("data-palette", palette === "colorblind" && "colorblind");
  toggle("data-text", text === "large" && "large");
}

