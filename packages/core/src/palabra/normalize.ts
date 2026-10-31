export const WORD_LENGTH = 5;

/**
 * Forma de comparación: minúsculas, sin tildes ni diéresis (á→a, ü→u) y con la Ñ como letra propia.
 * "Árbol", "ARBOL" y "árbol" son la misma palabra; "año" y "ano" no.
 */
export function normalizeWord(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/ñ/g, "ñ")
    .replace(/[̀-ͯ]/g, "");
}

/** Normaliza una sola tecla del teclado físico; devuelve null si no es una letra jugable. */
export function normalizeLetter(key: string): string | null {
  if ([...key].length !== 1) return null;
  const letter = normalizeWord(key);
  return /^[a-zñ]$/.test(letter) ? letter : null;
}

export const isPlayableWord = (word: string) => new RegExp(`^[a-zñ]{${WORD_LENGTH}}$`).test(word);

/** Se muestra en mayúsculas y sin tildes, igual que en las fichas. */
export const displayLetters = (word: string) => normalizeWord(word).toUpperCase();
