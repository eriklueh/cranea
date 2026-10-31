/** Lados del tablero desde donde se cuentan torres. */
export type Side = "top" | "bottom" | "left" | "right";

/** Pistas de borde: un número por fila o columna, 0 = sin pista. */
export interface TorresClues {
  top: number[];
  bottom: number[];
  left: number[];
  right: number[];
}

/**
 * Técnicas que necesita el solver:
 * 1 = lectura directa (límites por pista, únicos desnudos y ocultos)
 * 2 = cruce de una línea (combinaciones posibles de una fila o columna con sus pistas)
 * 3 = suposición (probar una altura en una casilla y llegar a una contradicción)
 */
export type Tier = 1 | 2 | 3;

export interface TorresConfig {
  size: number;
  minTier: Tier;
  maxTier: Tier;
}

export interface TorresPuzzle {
  id: string;
  size: number;
  clues: TorresClues;
  /** Casillas dadas, fila por fila; 0 = vacía. */
  givens: number[];
  /** Solución, fila por fila. */
  solution: number[];
  tier: Tier;
  steps: number;
  difficulty: number;
}
