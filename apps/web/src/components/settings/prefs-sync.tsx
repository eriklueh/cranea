"use client";
import { useEffect } from "react";
import { applyPrefs, usePrefs } from "@/lib/prefs";

/** Mantiene los atributos de <html> al día cuando cambian los ajustes (el primer valor lo pone el script de prefs-script.ts). */
export function PrefsSync() {
  const motion = usePrefs((s) => s.motion);
  const palette = usePrefs((s) => s.palette);
  const text = usePrefs((s) => s.text);
  useEffect(() => applyPrefs({ motion, palette, text }), [motion, palette, text]);
  return null;
}
