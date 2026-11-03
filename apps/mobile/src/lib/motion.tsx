/**
 * El sistema de movimiento de Craneá en la app (docs/motion.md). Los números salen de
 * `@cranea/core/motion`, los mismos que usa la web. Toda animación de la app pasa por acá:
 * nada de duraciones, resortes ni presets de Reanimated sueltos en los componentes.
 *
 * Movimiento reducido: el del sistema lo respeta Reanimated solo (`ReduceMotion.System`, el valor por
 * defecto de todo lo de abajo); el de Ajustes lo aplica `<MotionPreference />` en el layout raíz con
 * `ReducedMotionConfig`. En los dos casos cada animación salta a su estado final.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import {
  Easing,
  Keyframe,
  ReducedMotionConfig,
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { DURATION, HOP_MS, LOSS_RESULT_MS, MOTION, SHAKE_MS, STAGGER, staggerStep, WIN_RESULT_MS } from "@cranea/core/motion";
import { usePrefs } from "@/lib/prefs";

export { DURATION, HOP_MS, LOSS_RESULT_MS, MOTION, STAGGER, staggerStep, WIN_RESULT_MS };

type Speed = keyof typeof DURATION;

/** Ease-out cúbica (entrar, responder) y ease-in cúbica (salir): `cubic-bezier(.33,1,.68,1)` / `(.32,0,.67,0)` en la web. */
export const ease = { out: Easing.out(Easing.cubic), in: Easing.in(Easing.cubic) } as const;

/** Config de `withTiming` con un token: `withTiming(1, timing("fast"))`. */
export const timing = (speed: Speed = "base", curve: keyof typeof ease = "out") => ({ duration: DURATION[speed], easing: ease[curve] });

const frames = (from: Record<string, unknown>, to: Record<string, unknown>, speed: Speed, delay: number, curve: keyof typeof ease = "out") =>
  new Keyframe({ 0: from, 100: { ...to, easing: ease[curve] } }).duration(DURATION[speed]).delay(delay);

/** Catálogo de entradas y salidas (`entering` / `exiting` de Reanimated). */
export const motion = {
  /** Pantallas, tarjetas y avisos que entran: fundido + sube 8 dp, `base`. */
  appear: (delay = 0) => frames({ opacity: 0, transform: [{ translateY: MOTION.rise }] }, { opacity: 1, transform: [{ translateY: 0 }] }, "base", delay),
  /** Solo fundido, `base`: fondos, textos que cambian en el mismo lugar. */
  fade: (delay = 0) => frames({ opacity: 0 }, { opacity: 1 }, "base", delay),
  /** Lo que se tipea o se coloca (cifras, letras, alturas): 0,9 → 1 con fundido, `fast`. */
  pop: (delay = 0) => frames({ opacity: 0, transform: [{ scale: MOTION.popFrom }] }, { opacity: 1, transform: [{ scale: 1 }] }, "fast", delay),
  /** Una ficha de una fila o tablero que se revela (se da vuelta), `base`. Escalonar con `staggerStep`. */
  reveal: (delay = 0) =>
    frames(
      { opacity: 0, transform: [{ perspective: 400 }, { rotateX: "-90deg" }] },
      { opacity: 1, transform: [{ perspective: 400 }, { rotateX: "0deg" }] },
      "base",
      delay,
    ),
  /** Casilla que se pinta (Nonograma): 0,6 → 1, `fast`. */
  stamp: (delay = 0) => frames({ opacity: 0.4, transform: [{ scale: MOTION.stampFrom }] }, { opacity: 1, transform: [{ scale: 1 }] }, "fast", delay),
  /** Trazo que se dibuja de izquierda a derecha (tachado, cruz), `base`. */
  draw: (delay = 0, rotate = "0deg") =>
    frames({ transform: [{ rotate }, { scaleX: 0 }] }, { transform: [{ rotate }, { scaleX: 1 }] }, "base", delay),
  /** Diálogo centrado: fundido + 0,96 → 1 + sube 8 dp, `base`. */
  dialog: (delay = 0) =>
    frames(
      { opacity: 0, transform: [{ translateY: MOTION.rise }, { scale: MOTION.press }] },
      { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
      "base",
      delay,
    ),
  /** Hoja desde abajo: entra en `slow` sin pasarse; sale en `base` con ease-in. */
  sheetIn: () => SlideInDown.duration(DURATION.slow).easing(ease.out),
  sheetOut: () => SlideOutDown.duration(DURATION.base).easing(ease.in),
  /** Salida de cualquier cosa: fundido `fast` con ease-in. */
  exit: () => frames({ opacity: 1 }, { opacity: 0 }, "fast", 0, "in"),
};

/** Lo que acepta `entering` en los componentes que reciben la entrada desde afuera. */
export type Entering = ReturnType<typeof motion.appear>;

/** `press`: escala de teclas y fichas mientras se aprietan (los botones con sombra se hunden en su sombra). */
export const PRESS_SCALE = MOTION.press;

/** `celebrate`: salto hasta `to` (dp, negativo = arriba) y de vuelta. Subida `fast`, bajada `base`, sin rebote. */
export const hop = (delay: number, to: number) => withDelay(delay, withSequence(withTiming(to, timing("fast")), withTiming(0, timing("base"))));

/** `celebrate` / `confirm`: latido de escala hasta `to` y de vuelta a 1. */
export const pulse = (delay: number, to: number = MOTION.bump) => withDelay(delay, withSequence(withTiming(to, timing("fast")), withTiming(1, timing("base"))));

/**
 * Paso de una ola de festejo sobre `span + 1` diagonales para que entera (con el salto de cada
 * elemento) dure como mucho 600 ms.
 */
export const celebrateStep = (span: number) => staggerStep(span + 1, HOP_MS);

/** `shake`: sacudida horizontal de error (280 ms) para asignar a un `translateX`. `small` para una sola pieza. */
export function shake(small = false) {
  const path = small ? MOTION.shakeSmall : MOTION.shake;
  const leg = { duration: SHAKE_MS / path.length, easing: ease.out };
  return withSequence(...path.map((v) => withTiming(v, leg)));
}

/** `shake` cada vez que cambia `key` (> 0). */
export function useShake(key: number, small = false) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (key > 0) x.value = shake(small);
  }, [key, small, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}

/** Movimiento reducido del sistema (se actualiza si cambia). */
function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Si hay que evitar el movimiento: lo pidió el sistema o se eligió «Reducidas» en Ajustes. */
export function useMotionReduced() {
  const system = useSystemReducedMotion();
  const pref = usePrefs((s) => s.motion);
  return system || pref === "reduced";
}

/** Aplica «Animaciones: Reducidas» de Ajustes a todas las animaciones de Reanimated. Va una vez, en el layout raíz. */
export function MotionPreference() {
  const pref = usePrefs((s) => s.motion);
  return pref === "reduced" ? <ReducedMotionConfig mode={ReduceMotion.Always} /> : null;
}
