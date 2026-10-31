/** 0 = gris (no está, o no hay más), 1 = amarilla (está en otro lugar), 2 = verde (en su lugar). */
export type LetterScore = 0 | 1 | 2;

/** Una palabra probada y su puntaje. */
export interface Clue {
  /** Palabra normalizada. */
  word: string;
  scores: LetterScore[];
}

export interface PalabraConfig {
  /** Intentos para encontrar la palabra. */
  attempts: number;
  /** Modo difícil: lo que ya se descubrió hay que usarlo en el próximo intento. */
  hard: boolean;
}

export interface PalabraPuzzle extends PalabraConfig {
  id: string;
  /** Respuesta normalizada. */
  answer: string;
  /** Respuesta con tildes, para mostrar. */
  display: string;
}
