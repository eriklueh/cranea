import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";

/** Sacudida horizontal (la misma que la web) cada vez que cambia `key`. Respeta "reducir movimiento" del sistema. */
export function useShake(key: number) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (key > 0) x.value = withSequence(...[-6, 6, -4, 4, 0].map((v) => withTiming(v, { duration: 70 })));
  }, [key, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}

/**
 * Cuándo sube la hoja de resultado después de ganar. Los festejos de los cinco juegos terminan antes
 * (o se superponen apenas con la hoja): nada queda latiendo ni rebotando. Igual que la web.
 */
export const WIN_RESULT_MS = 800;
/** Después de perder solo se muestra la solución: el resultado llega antes. */
export const LOSS_RESULT_MS = 350;

/** Paso de una ola en diagonal de `span` pasos para que entera dure como mucho `budget` ms. */
export const waveStep = (span: number, budget = 360, max = 50) => Math.min(max, Math.round(budget / Math.max(1, span)));

const UP = { duration: 120, easing: Easing.out(Easing.quad) };
const DOWN = { duration: 170, easing: Easing.out(Easing.cubic) };

/** Salto corto hasta `to` y de vuelta, sin rebote (los resortes flojos se quedaban temblando). */
export const hop = (delay: number, to: number) => withDelay(delay, withSequence(withTiming(to, UP), withTiming(0, DOWN)));

/** Latido corto de escala hasta `to` y de vuelta a 1. */
export const pulse = (delay: number, to: number) => withDelay(delay, withSequence(withTiming(to, UP), withTiming(1, DOWN)));
