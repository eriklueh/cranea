import type { NamespaceShape } from "@cranea/core/i18n";

/** Cifra en la web: tablero, pistas, resultado, inicio y «Cómo se juega» (apps/web/src/games/cifra, app/cifra). */
export const es = {
  // Partida
  dailyTitle: "Cifra del día #{n}",
  sameBoard: "Mismo tablero para todos",
  preparing: "Preparando el tablero…",
  cluesLabel: "Pistas",
  codeLabel: "Tu código",
  seeResult: "Ver resultado",
  livesLabel: "Te quedan {left} de {max} intentos",
  delete: "Borrar",
  tryCode: "Probar código",

  // Fichas y puntajes (lectores de pantalla y leyendas)
  markNone: "sin marcar",
  markOut: "descartada",
  markIn: "va",
  markHere: "va ahí",
  tileLabel: "Cifra {digit}, posición {position}: {mark}.",
  tileTapToChange: " Tocá para cambiar.",
  rowHighlighted: "Fila señalada: ",
  missedGuess: "Tu intento fallido: ",
  exactLabel: "{n} en su lugar",
  presentLabel: "{n} en otro lugar",
  legendExact: "en su lugar",
  legendPresent: "está, en otro lugar",
  markLegend: "Tocá una cifra del tablero: una vez la descartás, dos va, tres va ahí.",

  // Marcas
  restoreMarksTitle: "Recuperar las marcas borradas",
  undo: "Deshacer",
  marksCleared: "Marcas borradas",
  clearMarksTitle: "Quitar todas las marcas de las cifras",
  clearMarksLabel: "Limpiar marcas ({count})",
  clear: "Limpiar",
  clearMarksSuffix: " marcas",

  // Lápiz
  boardTools: "Herramientas del tablero",
  pan: "Mover la página sin dibujar",
  undoStroke: "Deshacer último trazo",
  clearDrawing: "Borrar dibujo",
  stopDrawing: "Terminar de dibujar",
  stopDrawingTitle: "Terminar de dibujar (Escape)",
  startDrawing: "Dibujar sobre el tablero",
  pencilDone: "Listo",
  pencil: "Lápiz",
  drawingSurface: "Superficie para dibujar sobre el juego",
  drawing: "Dibujo de esta partida",

  // Pistas
  hint: "Pista",
  hintSeeDeduction: "Ver la deducción",
  hintMoreWithPlus: "Más pistas con Craneá Plus",
  hintAsk: "Pedir una pista",
  hintLockedLabel: "Pista, más pistas con Craneá Plus",
  hintAllShown: "Tus marcas ya muestran todo lo que se puede deducir. Escribí el código.",
  hintWhatFollows: "¿Qué se deduce?",
  hintClose: "Cerrar pista",
  hintRow: "la fila {n}",
  hintRows: "las filas {list}",
  hintSuppose: "Suponé una cifra en un lugar y cruzala con {rows}.",
  hintSupposeAll: "Suponé una cifra en un lugar y mirá si todo cierra.",
  hintCross: "Cruzá {rows} con lo que ya sabés.",
  hintRead: "Mirá {rows}: se lee sola.",

  // Resultado
  firstTry: "Al primer intento",
  cracked: "Código descifrado",
  outOfTries: "Se acabaron los intentos",
  wonDescription: "{title}, en {attempts} de {max} intentos y {time}.",
  lostDescription: "{title}, sin resolver. Este era el código:",
  solution: "Solución",
  howWasItSolved: "¿Cómo se resolvía?",
  hintsUsed: { one: "Usaste 1 pista", other: "Usaste {count} pistas" },
  seeRanking: "Ver ranking",
  nextLevel: "Siguiente nivel",
  backToWorlds: "Volver a los mundos",
  levelTitle: "Nivel {world}-{level}",
  shareText: "{marks} {score} en {time}",
  cardLost: "No salió",
  cardTries: { one: "Al primer intento", other: "{count} intentos" },
  cardUnsolved: "Sin resolver",

  // «¿Cómo se resolvía?»
  stepOf: "Paso {step} de {total}",
  onlyCodeLeft: "Queda un solo código posible: {code}.",
  previous: "Anterior",

  // Celebraciones
  worldComplete: "Mundo completo: {name}",
  totalTime: "Tiempo total",
  avgAttempts: "Intentos promedio",
  aWeek: "Una semana entera",
  aMonth: "Un mes entero",
  streakBody: "Resolviste el diario {n} días seguidos.",

  // Inicio
  dailyHomeTitle: "Cifra del día",
  dailyBlurb: "El mismo tablero para todos. Tres intentos.",
  inAttempts: { one: "en {count} intento", other: "en {count} intentos" },
  attemptsStat: "Intentos",

  // Cómo se juega
  howToTitle: "Cómo se juega Cifra",
  howToIntro:
    "Hay un código secreto de cifras distintas. El tablero ya trae varios intentos puntuados. Cada fila te dice cuántas de sus cifras están en el código y cuántas están en su lugar, pero nunca cuáles. Cruzando las filas, solo un código encaja con todas. Todas las cifras del código aparecen entre las pistas. Tenés tres intentos para escribirlo.",
  howToPegs: "A la izquierda, el círculo lleno cuenta las cifras en su lugar. A la derecha, el aro cuenta las que están en otro lugar.",
  howToSolveTitle: "Cómo se resuelve este",
  howToSolve:
    "El aro con un 3 indica que las tres cifras están en el código, pero ninguna en su lugar. Cruzá sus posiciones: el 7 no puede ir último por la primera fila, ni en el medio por la segunda, así que va primero. El 1 no puede ir primero ni último: va en el medio. El 0 ocupa el lugar que queda. El código es 710.",
  howToMarksTitle: "Marcá tus deducciones",
  howToMarks:
    "La raya la descarta, el aro indica que va en el código y el fondo sólido confirma que va ahí. Un cuarto toque la deja sin marcar. Cada casilla se marca por separado: tocar una ficha no cambia ninguna otra, aunque tengan la misma cifra o estén en la misma columna.",
  howToNotes:
    "Las marcas son tus notas: no completan el código ni descartan otras cifras automáticamente. También podés recorrer las fichas con Tab y cambiar sus marcas con Enter o Espacio.",
  howToWorldsTitle: "Los mundos",
  howToWorlds:
    "Cada mundo pide una técnica más. Primero las filas que se leen solas, después contar lo que ya sabés de cada fila, y al final suponer una cifra en un lugar para ver si todo se contradice. Ningún tablero necesita adivinar.",
  startPlaying: "Empezar a jugar",
};

export const en: NamespaceShape<typeof es> = {
  // Partida
  dailyTitle: "Daily Cifra #{n}",
  sameBoard: "Same board for everyone",
  preparing: "Setting up the board…",
  cluesLabel: "Clues",
  codeLabel: "Your code",
  seeResult: "See result",
  livesLabel: "{left} of {max} tries left",
  delete: "Delete",
  tryCode: "Try code",

  // Fichas y puntajes
  markNone: "unmarked",
  markOut: "ruled out",
  markIn: "in the code",
  markHere: "right spot",
  tileLabel: "Digit {digit}, position {position}: {mark}.",
  tileTapToChange: " Tap to change.",
  rowHighlighted: "Highlighted row: ",
  missedGuess: "Your missed guess: ",
  exactLabel: "{n} in the right spot",
  presentLabel: "{n} in another spot",
  legendExact: "right spot",
  legendPresent: "in the code, wrong spot",
  markLegend: "Tap a digit on the board: once rules it out, twice means it's in, three times means right spot.",

  // Marcas
  restoreMarksTitle: "Bring back the cleared marks",
  undo: "Undo",
  marksCleared: "Marks cleared",
  clearMarksTitle: "Remove all marks from the digits",
  clearMarksLabel: "Clear marks ({count})",
  clear: "Clear",
  clearMarksSuffix: " marks",

  // Lápiz
  boardTools: "Board tools",
  pan: "Scroll the page without drawing",
  undoStroke: "Undo last stroke",
  clearDrawing: "Erase drawing",
  stopDrawing: "Stop drawing",
  stopDrawingTitle: "Stop drawing (Escape)",
  startDrawing: "Draw on the board",
  pencilDone: "Done",
  pencil: "Pencil",
  drawingSurface: "Surface for drawing over the game",
  drawing: "Drawing for this game",

  // Pistas
  hint: "Hint",
  hintSeeDeduction: "See the deduction",
  hintMoreWithPlus: "More hints with Craneá Plus",
  hintAsk: "Get a hint",
  hintLockedLabel: "Hint, more hints with Craneá Plus",
  hintAllShown: "Your marks already show everything you can deduce. Enter the code.",
  hintWhatFollows: "What follows?",
  hintClose: "Close hint",
  hintRow: "row {n}",
  hintRows: "rows {list}",
  hintSuppose: "Assume a digit in one spot and cross-check it with {rows}.",
  hintSupposeAll: "Assume a digit in one spot and see if everything still adds up.",
  hintCross: "Cross-check {rows} with what you already know.",
  hintRead: "Look at {rows}: it speaks for itself.",

  // Resultado
  firstTry: "First try",
  cracked: "Code cracked",
  outOfTries: "Out of tries",
  wonDescription: "{title}, in {attempts} of {max} tries and {time}.",
  lostDescription: "{title}, unsolved. This was the code:",
  solution: "Solution",
  howWasItSolved: "How was it solved?",
  hintsUsed: { one: "You used 1 hint", other: "You used {count} hints" },
  seeRanking: "See leaderboard",
  nextLevel: "Next level",
  backToWorlds: "Back to worlds",
  levelTitle: "Level {world}-{level}",
  shareText: "{marks} {score} in {time}",
  cardLost: "Not this time",
  cardTries: { one: "First try", other: "{count} tries" },
  cardUnsolved: "Unsolved",

  // «¿Cómo se resolvía?»
  stepOf: "Step {step} of {total}",
  onlyCodeLeft: "Only one code is left: {code}.",
  previous: "Previous",

  // Celebraciones
  worldComplete: "World complete: {name}",
  totalTime: "Total time",
  avgAttempts: "Avg. tries",
  aWeek: "A whole week",
  aMonth: "A whole month",
  streakBody: "You solved the daily {n} days in a row.",

  // Inicio
  dailyHomeTitle: "Daily Cifra",
  dailyBlurb: "Same board for everyone. Three tries.",
  inAttempts: { one: "in {count} try", other: "in {count} tries" },
  attemptsStat: "Tries",

  // Cómo se juega
  howToTitle: "How to play Cifra",
  howToIntro:
    "There's a secret code made of different digits. The board comes with a few guesses that are already scored. Each row tells you how many of its digits are in the code and how many are in the right spot, but never which ones. Cross-check the rows and only one code fits them all. Every digit in the code shows up somewhere in the clues. You get three tries to enter it.",
  howToPegs: "On the left, the filled dot counts digits in the right spot. On the right, the ring counts digits that are in the code but in another spot.",
  howToSolveTitle: "How to solve this one",
  howToSolve:
    "A ring with a 3 means all three digits are in the code, but none is in its spot. Cross-check their positions: the 7 can't go last (first row) or in the middle (second row), so it goes first. The 1 can't go first or last: it goes in the middle. The 0 takes the spot that's left. The code is 710.",
  howToMarksTitle: "Mark your deductions",
  howToMarks:
    "A slash rules a digit out, a ring says it's in the code, and a solid fill confirms it's in the right spot. A fourth tap clears it. Each tile is marked on its own: tapping one never changes another, even if it has the same digit or sits in the same column.",
  howToNotes:
    "Marks are just your notes: they don't fill in the code or rule out other digits for you. You can also move through the tiles with Tab and change their marks with Enter or Space.",
  howToWorldsTitle: "The worlds",
  howToWorlds:
    "Each world adds a new technique. First, rows that speak for themselves; then, counting what you already know about each row; and finally, assuming a digit in a spot to see if everything falls apart. No board ever needs a guess.",
  startPlaying: "Start playing",
};
