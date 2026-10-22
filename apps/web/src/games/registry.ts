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
];
