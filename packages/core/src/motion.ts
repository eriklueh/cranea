/**
 * Sistema de movimiento de Craneá: los mismos números para la web y la app (ver docs/motion.md).
 *
 * - Tres duraciones, una curva para entrar (ease-out cúbica) y otra para salir (ease-in cúbica).
 * - Sin resortes que reboten: nada pasa de largo ni tiembla al llegar.
 * - La web los repite como variables CSS en apps/web/src/app/globals.css (`--dur-*`, `--ease-*`);
 *   un test compara los dos lugares.
 */

/** Duraciones en ms. `fast`: respuesta a un toque. `base`: entrar/cambiar. `slow`: hojas y paneles grandes. */
export const DURATION = { fast: 120, base: 200, slow: 280 } as const;

/** Curvas cúbicas de Bézier `[x1, y1, x2, y2]`. `out` para todo lo que entra o responde; `in` solo para salir. */
export const EASING = {
  out: [0.33, 1, 0.68, 1],
  in: [0.32, 0, 0.67, 0],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const cssEasing = (e: readonly [number, number, number, number]) => `cubic-bezier(${e.join(", ")})`;

/** Distancias y escalas de cada movimiento del catálogo. */
export const MOTION = {
  /** `appear`: sube esta cantidad de px/dp mientras aparece. */
  rise: 8,
  /** `pop`: escala inicial de lo que se tipea o se coloca. */
  popFrom: 0.9,
  /** `press`: escala mientras se aprieta. */
  press: 0.96,
  /** `confirm`: el latido de algo que quedó bien (hasta esta escala y de vuelta). */
  bump: 1.08,
  /** `stamp`: escala inicial de una casilla que se pinta (Nonograma). */
  stampFrom: 0.6,
  /** `shake`: recorrido en px/dp de la sacudida de error; la chica es para una sola casilla. */
  shake: [-6, 6, -4, 4, 0],
  shakeSmall: [-3, 3, -2, 2, 0],
  /** `celebrate`: salto hacia arriba (fracción del lado de la ficha). */
  hop: 0.2,
  /** `celebrate` en una grilla apretada (Nonograma): las casillas se achican hasta acá y vuelven. */
  dip: 0.85,
} as const;

/** Paso entre elementos de una secuencia (`reveal`, `celebrate`) y tope de toda la secuencia. */
export const STAGGER = { step: 60, max: 600 } as const;

/** `shake` entero (5 tramos). */
export const SHAKE_MS = 280;
/** Lo único que se repite: esqueletos de carga y el resaltado del tutorial (una vuelta). */
export const LOOP_MS = 1600;
/** `celebrate`: subida `fast` + bajada `base` por elemento. */
export const HOP_MS = DURATION.fast + DURATION.base;

/**
 * Paso para escalonar `count` elementos de `itemMs` cada uno sin que la secuencia entera pase de
 * `budget` ms (y nunca más que `STAGGER.step`). Con un solo elemento, 0.
 */
export function staggerStep(count: number, itemMs: number = DURATION.base, budget: number = STAGGER.max) {
  if (count <= 1) return 0;
  return Math.max(0, Math.min(STAGGER.step, Math.floor((budget - itemMs) / (count - 1))));
}

/**
 * Cuándo sube el resultado después de ganar: los festejos (≤ 600 ms) ya terminaron o están por
 * terminar. Después de perder solo se muestra la solución, así que llega antes.
 */
export const WIN_RESULT_MS = 800;
export const LOSS_RESULT_MS = 350;
