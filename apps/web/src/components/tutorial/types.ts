import type { Verdict } from "./machine";

/**
 * Lo que se resalta: el nombre de un `data-tutorial="..."` o una lista de nombres
 * (un solo hueco que los abarca a todos, por ejemplo una fila de casillas).
 */
export type Target = string | readonly string[];

export interface TutorialStep<S> {
  /** Frases cortas, ya en el idioma activo (en español, con voseo). */
  text: string;
  /** Lo que se ve y se puede tocar; el resto queda oscurecido y bloqueado. */
  targets?: readonly Target[];
  /** Junto a qué se ubica el globo (por defecto, el primer resaltado). */
  anchor?: Target;
  /** Sin `check` es un paso de lectura: avanza con Siguiente. */
  check?: (s: S) => Verdict;
  /** Aviso si la jugada no es la esperada (ya traducido). */
  nudge?: string;
  /** Espera antes de pasar al siguiente, para que se vea la animación de la jugada. */
  delay?: number;
}

/** Lo mínimo de un store de Zustand que usa el tutorial. */
export interface TutorialStore<S> {
  getState: () => S;
  setState: (partial: Partial<S>) => void;
  subscribe: (listener: (state: S, prev: S) => void) => () => void;
}

export interface TutorialScript<S> {
  game: string;
  /** Nombre del juego (marca, no se traduce), para los textos ("Tutorial de Cifra" / "Cifra tutorial"). */
  name: string;
  levelHref: string;
  homeHref: string;
  store: TutorialStore<S>;
  /** true cuando el juego ya arrancó el tablero del tutorial. */
  live: (s: S) => boolean;
  /** Huella de lo que importa: si no cambia, la jugada no se evalúa. */
  key: (s: S) => string;
  /** Lo que hay que guardar para deshacer una jugada que no era. */
  snapshot: (s: S) => Partial<S>;
  steps: readonly TutorialStep<S>[];
  /** Vuelve a arrancar el tablero del tutorial (para "Repetir"). */
  reset: () => void;
  /** Texto final, antes de ir al nivel 1 (ya traducido). */
  outro: string;
}
