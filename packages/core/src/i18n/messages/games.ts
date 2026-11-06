import type { NamespaceShape } from "../translate";

/**
 * Juegos. Los nombres son marcas y no se traducen (Cifra, Puentes, Nonograma, Torres, Palabra);
 * en inglés se acompañan con un subtítulo (`*Sub`): «Puentes · Bridges». En español `*Sub` va vacío.
 */
export const es = {
  cifraName: "Cifra",
  cifraSub: "",
  cifraTagline: "Descubrí el código secreto cruzando pistas ya puntuadas.",
  puentesName: "Puentes",
  puentesSub: "",
  puentesTagline: "Uní todas las islas con puentes, sin cruzarlos.",
  nonogramaName: "Nonograma",
  nonogramaSub: "",
  nonogramaTagline: "Pintá casillas siguiendo los números hasta que aparezca el dibujo.",
  palabraName: "Palabra",
  palabraSub: "",
  palabraTagline: "Adiviná la palabra de cinco letras con la ayuda de los colores.",
  torresName: "Torres",
  torresSub: "",
  torresTagline: "Levantá la ciudad: cada borde dice cuántas torres se ven.",
  spanishOnlyTitle: "Este juego es solo en español",
  spanishOnlyBody: "Palabra usa palabras en castellano, así que solo aparece con la app en español.",
  spanishOnlyAction: "Cambiar a español",
};

export const en: NamespaceShape<typeof es> = {
  cifraName: "Cifra",
  cifraSub: "Codebreaker",
  cifraTagline: "Crack the secret code by cross-checking clues that are already scored.",
  puentesName: "Puentes",
  puentesSub: "Bridges",
  puentesTagline: "Link every island with bridges, without crossing them.",
  nonogramaName: "Nonograma",
  nonogramaSub: "Nonogram",
  nonogramaTagline: "Fill in squares following the numbers until a picture appears.",
  palabraName: "Palabra",
  palabraSub: "Word",
  palabraTagline: "Guess the five-letter Spanish word with help from the colors.",
  torresName: "Torres",
  torresSub: "Towers",
  torresTagline: "Build the city: each edge tells you how many towers you can see.",
  spanishOnlyTitle: "This game is only available in Spanish",
  spanishOnlyBody: "Palabra is played with Spanish words, so it only shows up when the app is in Spanish.",
  spanishOnlyAction: "Switch to Spanish",
};
