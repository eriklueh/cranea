import type { GameMeta } from "@cranea/core";

/** Para sumar un juego: agregalo acá, creá su carpeta en src/games y sus rutas en src/app. */
export const GAMES: GameMeta[] = [
  {
    id: "cifra",
    name: "Cifra",
    tagline: "Descubrí el código secreto cruzando pistas ya puntuadas.",
    path: "/cifra",
    status: "live",
  },
  {
    id: "puentes",
    name: "Puentes",
    tagline: "Uní todas las islas con puentes, sin cruzarlos.",
    path: "/puentes",
    status: "live",
  },
  {
    id: "nonograma",
    name: "Nonograma",
    tagline: "Pintá casillas siguiendo los números hasta que aparezca el dibujo.",
    path: "/nonograma",
    status: "live",
  },
  {
    id: "palabra",
    name: "Palabra",
    tagline: "Encontrá la palabra oculta cruzando palabras ya puntuadas.",
    path: "/palabra",
    status: "live",
  },
];
