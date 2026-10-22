export type Code = readonly number[];

export interface Feedback {
  /** Dígitos en su lugar. */
  exact: number;
  /** Dígitos que están en el código pero en otro lugar. */
  present: number;
}

export interface Clue {
  guess: Code;
  feedback: Feedback;
}

/**
 * Técnicas que necesita el solver:
 * 1 = lectura directa (filas en cero, filas completas, descartes simples)
 * 2 = cruce de filas (contar lo que ya sabés en cada fila)
 * 3 = suposición (probar un dígito y llegar a una contradicción)
 */
export type Tier = 1 | 2 | 3;

export interface CifraConfig {
  length: number;
  minRows: number;
  maxRows: number;
  maxZeroRows: number;
  /** Cantidad máxima de cifras distintas descartadas por filas en cero. */
  maxDirectEliminations: number;
  minTier: Tier;
  maxTier: Tier;
}

export interface CifraPuzzle {
  id: string;
  length: number;
  clues: Clue[];
  solution: Code;
  tier: Tier;
  steps: number;
  difficulty: number;
}
