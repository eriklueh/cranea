/** 0 = gris (no está, o no hay más), 1 = amarilla (está en otro lugar), 2 = verde (en su lugar). */
export type LetterScore = 0 | 1 | 2;

export interface Clue {
  /** Palabra normalizada. */
  word: string;
  scores: LetterScore[];
}

export interface PalabraConfig {
  minRows: number;
  maxRows: number;
  /** Verdes sumadas en todo el tablero. */
  minGreens: number;
  maxGreens: number;
  /** Amarillas sumadas en todo el tablero. */
  minYellows: number;
  maxYellows: number;
  /** Ninguna fila puede regalar tantas verdes juntas. */
  maxGreensPerRow: number;
  /** Filas todas grises. */
  maxGrayRows: number;
  /** Palabras válidas que no son respuestas y también encajan (solo cuentan para el balance). */
  maxAlternatives: number;
}

export interface PalabraPuzzle {
  id: string;
  /** Respuesta normalizada. */
  answer: string;
  /** Respuesta con tildes, para mostrar. */
  display: string;
  clues: Clue[];
  difficulty: number;
}
