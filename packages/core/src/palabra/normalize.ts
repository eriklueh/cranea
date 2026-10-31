export const WORD_LENGTH = 5;

/**
 * Forma de comparación: minúsculas, sin tildes ni diéresis (á→a, ü→u) y con la Ñ como letra propia.
 * "Árbol", "ARBOL" y "árbol" son la misma palabra; "año" y "ano" no.
 */
export function normalizeWord(input: string): string {
  return decompose(input.trim().toLowerCase())
    .replace(/ñ/g, "ñ")
    .replace(/[̀-ͯ]/g, "");
}

/** Vocales del español con tilde, diéresis o acento, para motores de JS sin `normalize` (algunos builds de Hermes). */
const ACCENTED: Record<string, string> = {
  "á": "a", "à": "a", "ä": "a", "â": "a",
  "é": "e", "è": "e", "ë": "e", "ê": "e",
  "í": "i", "ì": "i", "ï": "i", "î": "i",
  "ó": "o", "ò": "o", "ö": "o", "ô": "o",
  "ú": "u", "ù": "u", "ü": "u", "û": "u",
};

/** NFD cuando el motor lo trae; si no, el mismo resultado para el alfabeto del juego. */
function decompose(text: string): string {
  try {
    if (typeof text.normalize === "function") return text.normalize("NFD");
  } catch {
    /* sin datos de Unicode: sigue abajo */
  }
  return text.replace(/[à-äè-ëì-ïò-öù-ü]/g, (c) => ACCENTED[c] ?? c);
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
