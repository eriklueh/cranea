"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { getPrefs } from "@/lib/prefs";
import { sound, type SoundEvent } from "@/lib/sound";

/** Movimiento reducido del sistema o elegido en Ajustes (atributo `data-motion` en <html>). */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  (document.documentElement.dataset.motion === "reduced" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);

const PATTERNS = { tap: 8, invalid: 22, win: [14, 60, 22] } satisfies Record<string, VibratePattern>;
const SOUND_FOR: Record<keyof typeof PATTERNS, SoundEvent> = { tap: "tap", invalid: "error", win: "win" };

export const canVibrate = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

/**
 * Respuesta para momentos que importan (ganar, jugada inválida): vibración corta y su sonido,
 * cada uno según Ajustes. La vibración, solo donde el dispositivo la soporta.
 */
export function haptic(kind: keyof typeof PATTERNS) {
  sound(SOUND_FOR[kind]);
  if (!canVibrate() || !getPrefs().vibration) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* algunos navegadores la bloquean sin un gesto del usuario */
  }
}

/** Llama a `run` cada vez que `value` cambia después del primer render. */
export function useOnChange<T>(value: T, run: (value: T, previous: T) => void) {
  const previous = useRef(value);
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    const before = previous.current;
    previous.current = value;
    latest.current(value, before);
  }, [value]);
}

export const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(6px)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(4px)" },
  { transform: "translateX(0)" },
];

/** Anima un elemento con la Web Animations API sin volver a montarlo. No hace nada con movimiento reducido. */
export function play(ref: RefObject<Element | null>, keyframes: Keyframe[] = SHAKE, options: KeyframeAnimationOptions = { duration: 380, easing: "ease-in-out" }) {
  if (prefersReducedMotion()) return;
  ref.current?.animate?.(keyframes, options);
}

/** Pasa a true `ms` después de que `active` se vuelve true (al instante con movimiento reducido), para no tapar una animación. */
export function useSettled(active: boolean, ms: number) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!active) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), prefersReducedMotion() ? 0 : ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return active && settled;
}
