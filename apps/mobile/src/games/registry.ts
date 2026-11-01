import type { Href } from "expo-router";

/**
 * Los cinco juegos, en el mismo orden y con los mismos textos que la web (apps/web/src/games/registry.ts).
 * `mobile`: "live" si el juego ya está portado a la app nativa; "soon" muestra "Muy pronto".
 */
export interface MobileGame {
  id: string;
  name: string;
  tagline: string;
  href: Href;
  mobile: "live" | "soon";
}

export const GAMES: MobileGame[] = [
  { id: "cifra", name: "Cifra", tagline: "Descubrí el código secreto cruzando pistas ya puntuadas.", href: "/cifra", mobile: "live" },
  { id: "puentes", name: "Puentes", tagline: "Uní todas las islas con puentes, sin cruzarlos.", href: "/puentes", mobile: "live" },
  { id: "nonograma", name: "Nonograma", tagline: "Pintá casillas siguiendo los números hasta que aparezca el dibujo.", href: { pathname: "/pronto/[game]", params: { game: "nonograma" } }, mobile: "soon" },
  { id: "palabra", name: "Palabra", tagline: "Adiviná la palabra de cinco letras con la ayuda de los colores.", href: "/palabra", mobile: "live" },
  { id: "torres", name: "Torres", tagline: "Levantá la ciudad: cada borde dice cuántas torres se ven.", href: { pathname: "/pronto/[game]", params: { game: "torres" } }, mobile: "soon" },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id) ?? null;
