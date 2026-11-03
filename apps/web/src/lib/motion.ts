"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { cssEasing, DURATION, EASING, HOP_MS, MOTION, SHAKE_MS, staggerStep } from "@cranea/core/motion";
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

/*
 * Sistema de movimiento (docs/motion.md): los mismos números que la app, de @cranea/core/motion.
 * Las clases `anim-*` de globals.css usan las mismas variables CSS.
 */
export { DURATION, LOSS_RESULT_MS, MOTION, WIN_RESULT_MS } from "@cranea/core/motion";

const path = (offsets: readonly number[]): Keyframe[] => [{ transform: "translateX(0)" }, ...offsets.map((x) => ({ transform: `translateX(${x}px)` }))];
/** `shake`: sacudida de error; la chica, para una sola pieza. */
export const SHAKE = path(MOTION.shake);
export const SHAKE_SMALL = path(MOTION.shakeSmall);

/** `shake` con la Web Animations API, sin volver a montar el elemento. No hace nada con movimiento reducido. */
export function play(ref: RefObject<Element | null>, keyframes: Keyframe[] = SHAKE) {
  if (prefersReducedMotion()) return;
  ref.current?.animate?.(keyframes, { duration: SHAKE_MS, easing: cssEasing(EASING.out) });
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

/** `--step` de un `reveal` de `count` fichas (cada una `base`): la fila entera en ≤ 600 ms. */
export const revealStep = (count: number) => `${staggerStep(count, DURATION.base)}ms`;
/** Lo que tarda en revelarse una fila de `count` fichas. */
export const revealMs = (count: number) => staggerStep(count, DURATION.base) * (count - 1) + DURATION.base;
/** `--step` de una ola de festejo sobre `span + 1` diagonales (o lugares): entera en ≤ 600 ms. */
export const celebrateStep = (span: number) => `${staggerStep(span + 1, HOP_MS)}ms`;
/** `--step` para escalonar `count` elementos de `pop` (120 ms). */
export const popStep = (count: number) => `${staggerStep(count, DURATION.fast)}ms`;
