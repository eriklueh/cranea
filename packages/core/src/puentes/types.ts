/** Isla en la cuadrícula: fila, columna y cantidad de puentes que necesita. */
export interface Island {
  r: number;
  c: number;
  n: number;
}

/** Par de islas que se ven en línea recta, sin otra isla en el medio. Siempre a < b. */
export interface Edge {
  a: number;
  b: number;
  /** true si las islas están en la misma fila. */
  horizontal: boolean;
}

/** Puentes por conexión, en el orden de `edges` (0, 1 o 2). */
export type Bridges = readonly number[];

/**
 * Técnicas que necesita el solver:
 * 1 = conteo: lo que le falta a cada isla contra lo que pueden darle sus vecinas
 * 2 = conexión: no cerrar grupos aislados y usar la única salida de un grupo
 * 3 = suposición: probar un puente y llegar a una contradicción
 */
export type Tier = 1 | 2 | 3;

export interface PuentesConfig {
  width: number;
  height: number;
  minIslands: number;
  maxIslands: number;
  /** Probabilidad de que un puente del generador sea doble. */
  doubleRate: number;
  /** Probabilidad de sumar un puente extra que cierra un ciclo. */
  loopRate: number;
  minTier: Tier;
  maxTier: Tier;
}

export interface PuentesPuzzle {
  id: string;
  width: number;
  height: number;
  islands: Island[];
  edges: Edge[];
  solution: Bridges;
  tier: Tier;
  steps: number;
  difficulty: number;
}
