/**
 * Motor de pasos del tutorial, sin React ni DOM (lo prueban los tests de scripts/).
 * Un paso "info" avanza con Siguiente. Un paso de acción mira el estado del juego después de cada
 * jugada y responde: listo (avanza), bien (sigue en el paso y lo acepta), mal (se deshace y avisa)
 * o nada (no cambia algo que importe).
 */

export type Verdict = "done" | "progress" | "wrong" | "ignore";

export interface StepMeta {
  /** Tiene una acción que esperar (si no, es un paso de lectura con Siguiente). */
  action: boolean;
  /** Aviso si la jugada no es la esperada. */
  nudge?: string;
}

export interface TutorialState {
  step: number;
  status: "active" | "finished" | "skipped";
  nudge: string | null;
  /** Cambia con cada aviso, para repetirlo aunque el texto sea el mismo. */
  nudgeKey: number;
}

export type TutorialEvent =
  | { type: "next" }
  | { type: "verdict"; verdict: Verdict }
  | { type: "outside" }
  | { type: "skip" }
  | { type: "restart" };

/** Qué tiene que hacer el juego con la jugada: aceptarla como nuevo punto de partida o deshacerla. */
export type Effect = "accept" | "revert" | null;

export const NUDGE = {
  wrong: "Esa no. Probá con lo resaltado.",
  outside: "Tocá lo resaltado.",
  info: "Primero tocá Siguiente.",
} as const;

export const initialState = (): TutorialState => ({ step: 0, status: "active", nudge: null, nudgeKey: 0 });

const advance = (s: TutorialState, total: number): TutorialState =>
  s.step + 1 >= total ? { ...s, status: "finished", nudge: null } : { ...s, step: s.step + 1, nudge: null };

const nudged = (s: TutorialState, text: string): TutorialState => ({ ...s, nudge: text, nudgeKey: s.nudgeKey + 1 });

export function reduce(state: TutorialState, event: TutorialEvent, steps: readonly StepMeta[]): { state: TutorialState; effect: Effect } {
  if (event.type === "restart") return { state: initialState(), effect: null };
  if (state.status !== "active") return { state, effect: null };
  if (event.type === "skip") return { state: { ...state, status: "skipped", nudge: null }, effect: null };
  const meta = steps[state.step];
  if (!meta) return { state: { ...state, status: "finished" }, effect: null };

  switch (event.type) {
    case "next":
      return meta.action ? { state: nudged(state, meta.nudge ?? NUDGE.outside), effect: null } : { state: advance(state, steps.length), effect: null };
    case "outside":
      return { state: nudged(state, meta.action ? (meta.nudge ?? NUDGE.outside) : NUDGE.info), effect: null };
    case "verdict": {
      const { verdict } = event;
      if (verdict === "ignore") return { state, effect: null };
      // En un paso de lectura, cualquier jugada se deshace: primero hay que leer.
      if (!meta.action) return { state: nudged(state, NUDGE.info), effect: "revert" };
      if (verdict === "wrong") return { state: nudged(state, meta.nudge ?? NUDGE.wrong), effect: "revert" };
      if (verdict === "progress") return { state: { ...state, nudge: null }, effect: "accept" };
      return { state: advance(state, steps.length), effect: "accept" };
    }
  }
}

/** Avance "3 de 7" para mostrar y anunciar. */
export const progressLabel = (step: number, total: number) => `Paso ${Math.min(step + 1, total)} de ${total}`;
