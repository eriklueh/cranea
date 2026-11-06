import type { NamespaceShape } from "@cranea/core/i18n";

/** Puentes en la web: tablero, controles, resultado, inicio y «Cómo se juega» (apps/web/src/games/puentes, app/puentes). */
export const es = {
  // Tablero (lectores de pantalla)
  islandsLabel: "Islas",
  islandLabel: "Isla {n}, fila {r}, columna {c}: {have} de {n} puentes{state}.",
  islandComplete: ", completa",
  islandOver: ", sobran puentes",
  boardLabel: "Tablero",

  // Avisos
  noticeWon: "Todas las islas quedaron conectadas.",
  noticeReview: "Ya jugaste el de hoy. Esta es la solución; mañana hay otro.",
  noticeBlocked: "Ese puente cruzaría otro.",
  noticeWrong: { one: "Hay un puente de más. Quedó marcado en rojo.", other: "Hay {count} puentes de más. Quedaron marcados en rojo." },
  noticeOk: { one: "Vas bien. Falta un puente.", other: "Vas bien. Faltan {count} puentes." },

  // Partida
  dailyTitle: "Puentes del día #{n}",
  sameBoard: "Mismo tablero para todos",
  preparing: "Preparando el tablero…",
  noMistakes: "Sin errores",
  backToWorlds: "Volver a los mundos",
  /** {result}: "sin errores"; {short}: "sin errores" / "1 error" en minúscula (lo usa el inglés). */
  seeResult: "Ver resultado ({result})",
  undo: "Deshacer",
  reset: "Empezar de nuevo",
  check: "Revisar",
  controlsHelp: "Deslizá desde una isla o tocá dos islas para tender un puente. Tocá el puente para sumar el segundo o sacarlo.",

  // Resultado
  mistakesText: { one: "con 1 error", other: "con {count} errores" },
  mistakesNone: "sin errores",
  levelTitle: "Puentes {world}-{level}",
  shareText: "🌉 {mistakes} en {time}",
  islands: { one: "{count} isla", other: "{count} islas" },
  allLinkedNoMistakes: "Todo conectado, sin errores",
  allLinked: "Todo conectado",
  resultDescription: "{title}, {mistakes} y en {time}.",
  nextLevel: "Siguiente nivel",

  // Inicio
  dailyHomeTitle: "Puentes del día",
  dailyBlurb: "Un mapa nuevo, el mismo para todos.",
  mistakesStat: "Errores",

  // Cómo se juega
  howToTitle: "Cómo se juega Puentes",
  howToIntro:
    "Cada círculo es una isla y su número dice cuántos puentes salen de ella. Uní las islas con puentes rectos, en horizontal o en vertical, hasta que todas queden conectadas en un solo grupo.",
  howToRule1: "Entre dos islas puede haber uno o dos puentes, nunca más.",
  howToRule2: "Los puentes no se cruzan ni pasan por encima de otra isla.",
  howToRule3: "Cada isla tiene que tener exactamente los puentes que pide su número.",
  howToRule4: "Todas las islas tienen que quedar unidas: desde cualquiera se llega a cualquier otra.",
  howToExampleTitle: "Un ejemplo",
  howToExampleEmpty: "Tablero de ejemplo sin puentes",
  howToExampleSolved: "El mismo tablero resuelto",
  howToExample:
    "El 4 de la esquina solo ve dos islas, y a cada una le puede tender dos puentes como máximo: necesita los dos dobles. Con eso el 2 ya está completo y no puede bajar hacia el 1. Entonces el 1 se une con el 3, que llega a sus tres puentes. Cuando una isla está completa se pinta de verde.",
  howToBuildTitle: "Cómo se tienden",
  /** {undo} y {reset} van en negrita con los nombres de los botones. */
  howToBuild:
    "Deslizá el dedo desde una isla hacia una vecina, o tocá una isla y después la otra. Tocar un puente suma el segundo, y un tercer toque lo saca. {undo} vuelve un paso atrás y {reset} saca todos los puentes (también se puede deshacer).",
  howToKeyboard:
    "Con teclado: Tab llega al tablero, las flechas te mueven entre islas y Mayús + flecha tiende un puente hacia ese lado. Enter elige una isla para unirla con otra. Ctrl + Z deshace.",
  howToCheckTitle: "Revisar y errores",
  /** {check} va en negrita con el nombre del botón. */
  howToCheck:
    "{check} marca en rojo los puentes que sobran. Si encuentra alguno, suma un error; si todo lo que tendiste está bien, te dice cuántos faltan sin sumar nada. Un puente que cruzaría a otro no se tiende y no cuenta como error. El tablero se resuelve solo cuando todo encaja. Tus intentos son 1 más los errores: resolverlo sin errores vale tres puntitos en el mapa.",
  howToWorldsTitle: "Los mundos",
  howToWorlds:
    "Primero alcanza con contar lo que le falta a cada isla. Después hay que cuidar que ningún grupo quede aislado: por ejemplo, dos islas con un 1 no pueden unirse entre sí. Al final, en mapas grandes, conviene suponer un puente y ver si todo se contradice. Cada tablero tiene una sola solución y ninguno necesita adivinar.",
  howToDaily: "El mapa del día es el mismo para todos y se juega una vez.",
  startPlaying: "Empezar a jugar",
};

export const en: NamespaceShape<typeof es> = {
  // Tablero
  islandsLabel: "Islands",
  islandLabel: "Island {n}, row {r}, column {c}: {have} of {n} bridges{state}.",
  islandComplete: ", complete",
  islandOver: ", too many bridges",
  boardLabel: "Board",

  // Avisos
  noticeWon: "Every island is connected.",
  noticeReview: "You already played today's. Here's the solution; there's a new one tomorrow.",
  noticeBlocked: "That bridge would cross another one.",
  noticeWrong: { one: "There's one bridge too many. It's marked in red.", other: "There are {count} bridges too many. They're marked in red." },
  noticeOk: { one: "Looking good. One bridge to go.", other: "Looking good. {count} bridges to go." },

  // Partida
  dailyTitle: "Daily Puentes #{n}",
  sameBoard: "Same board for everyone",
  preparing: "Setting up the board…",
  noMistakes: "No mistakes",
  backToWorlds: "Back to worlds",
  seeResult: (p) => `See result (${p.short})`,
  undo: "Undo",
  reset: "Start over",
  check: "Check",
  controlsHelp: "Swipe from an island or tap two islands to build a bridge. Tap a bridge to add a second one or remove it.",

  // Resultado
  mistakesText: { one: "with 1 mistake", other: "with {count} mistakes" },
  mistakesNone: "with no mistakes",
  levelTitle: "Puentes {world}-{level}",
  shareText: "🌉 {mistakes} in {time}",
  islands: { one: "{count} island", other: "{count} islands" },
  allLinkedNoMistakes: "All connected, no mistakes",
  allLinked: "All connected",
  resultDescription: "{title}, {mistakes}, in {time}.",
  nextLevel: "Next level",

  // Inicio
  dailyHomeTitle: "Daily Puentes",
  dailyBlurb: "A new map, the same for everyone.",
  mistakesStat: "Mistakes",

  // Cómo se juega
  howToTitle: "How to play Puentes",
  howToIntro:
    "Each circle is an island, and its number says how many bridges leave it. Link the islands with straight bridges, across or up and down, until they're all connected in one group.",
  howToRule1: "Two islands can share one or two bridges, never more.",
  howToRule2: "Bridges can't cross each other or pass over another island.",
  howToRule3: "Each island needs exactly as many bridges as its number.",
  howToRule4: "Every island must be connected: you can get from any island to any other.",
  howToExampleTitle: "An example",
  howToExampleEmpty: "Example board with no bridges",
  howToExampleSolved: "The same board, solved",
  howToExample:
    "The 4 in the corner only sees two islands, and it can send at most two bridges to each: it needs both doubles. That completes the 2, so it can't go down to the 1. So the 1 links to the 3, which reaches its three bridges. When an island is complete, it turns green.",
  howToBuildTitle: "Building bridges",
  howToBuild:
    "Swipe from an island toward a neighbor, or tap one island and then the other. Tapping a bridge adds a second one, and a third tap removes it. {undo} goes back one step and {reset} removes every bridge (you can undo that too).",
  howToKeyboard:
    "With a keyboard: Tab gets you to the board, the arrow keys move between islands, and Shift + arrow builds a bridge in that direction. Enter picks an island to link to another. Ctrl + Z undoes.",
  howToCheckTitle: "Checking and mistakes",
  howToCheck:
    "{check} marks extra bridges in red. If it finds any, that's a mistake; if everything you've built is right, it tells you how many are missing without counting anything. A bridge that would cross another isn't built and doesn't count as a mistake. The board is solved as soon as everything fits. Your tries are 1 plus your mistakes: solving it with no mistakes earns three dots on the map.",
  howToWorldsTitle: "The worlds",
  howToWorlds:
    "At first, counting what each island still needs is enough. Later you have to make sure no group gets cut off: for example, two islands with a 1 can't link to each other. Finally, on big maps, it helps to assume a bridge and see if everything falls apart. Every board has exactly one solution and none needs a guess.",
  howToDaily: "The daily map is the same for everyone and can be played once.",
  startPlaying: "Start playing",
};
