import type { NamespaceShape } from "@cranea/core/i18n";

/** Torres en la web: tablero, controles, resultado, inicio y «Cómo se juega» (apps/web/src/games/torres, app/torres). */
export const es = {
  // Tablero (lectores de pantalla)
  sideTop: "arriba",
  sideBottom: "abajo",
  sideLeft: "la izquierda",
  sideRight: "la derecha",
  row: "fila {n}",
  column: "columna {n}",
  clueLabel: "Desde {side}, {line}: se ven {value}{state}",
  clueOk: ", cumplida",
  clueConflict: ", no se cumple",
  cellLabel: "Fila {r}, columna {c}: {content}",
  cellHeight: "altura {v}",
  cellEmpty: "vacía",
  cellGiven: ", dada",
  cellRepeated: ", repetida",
  cellWrong: ", incorrecta",
  cellNotes: ", notas {list}",
  boardLabel: "Tablero de {n} por {n}",

  // Controles
  padNote: "Nota {v}",
  padHeight: "Altura {v}",
  eraseCell: "Borrar casilla",
  notes: "Notas",
  undo: "Deshacer",
  reset: "Reiniciar",
  check: "Comprobar",
  checkOk: "Todo bien hasta acá.",
  checkLost: "Se acabaron los intentos.",
  checkWrong: { one: "Hay casillas para revisar. Te queda un intento.", other: "Hay casillas para revisar. Te quedan {count} intentos." },
  livesLabel: "Te quedan {left} de {max} intentos",

  // Partida
  dailyTitle: "Torres del día #{n}",
  sameBoard: "Mismo tablero para todos",
  city: "Ciudad",
  controls: "Controles",
  seeResult: "Ver resultado",

  // Resultado
  resultFlawless: "Sin un solo error",
  resultWon: "Ciudad completa",
  resultLost: "Se acabaron los intentos",
  resultWonDesc: "{title}, en {attempts} de {max} intentos y {time}.",
  resultLostDesc: "{title}, sin resolver. Así quedaba la ciudad:",
  shareLine: "{marks} {score} en {time}",
  cardLost: "No salió",
  cardNoMistakes: "sin errores",
  cardUnsolved: "Sin resolver · {time}",
  nextLevel: "Siguiente nivel",
  backToWorlds: "Volver a los mundos",

  // Inicio
  dailyName: "Torres del día",
  dailyBlurb: "Una ciudad de 5×5, la misma para todos.",
  inAttempts: { one: "en {count} intento", other: "en {count} intentos" },
  statAttempts: "Intentos",

  // Cómo se juega
  howToTitle: "Cómo se juega Torres",
  startPlaying: "Empezar a jugar",
};

export const en: NamespaceShape<typeof es> = {
  sideTop: "the top",
  sideBottom: "the bottom",
  sideLeft: "the left",
  sideRight: "the right",
  row: "row {n}",
  column: "column {n}",
  clueLabel: "From {side}, {line}: {value} visible{state}",
  clueOk: ", satisfied",
  clueConflict: ", not satisfied",
  cellLabel: "Row {r}, column {c}: {content}",
  cellHeight: "height {v}",
  cellEmpty: "empty",
  cellGiven: ", given",
  cellRepeated: ", repeated",
  cellWrong: ", wrong",
  cellNotes: ", notes {list}",
  boardLabel: "{n} by {n} board",

  padNote: "Note {v}",
  padHeight: "Height {v}",
  eraseCell: "Clear square",
  notes: "Notes",
  undo: "Undo",
  reset: "Restart",
  check: "Check",
  checkOk: "All good so far.",
  checkLost: "Out of tries.",
  checkWrong: { one: "Some squares need another look. 1 try left.", other: "Some squares need another look. {count} tries left." },
  livesLabel: "{left} of {max} tries left",

  dailyTitle: "Daily Torres #{n}",
  sameBoard: "Same board for everyone",
  city: "City",
  controls: "Controls",
  seeResult: "See result",

  resultFlawless: "Not a single mistake",
  resultWon: "City complete",
  resultLost: "Out of tries",
  resultWonDesc: "{title}, in {attempts} of {max} tries and {time}.",
  resultLostDesc: "{title}, unsolved. Here's how the city looked:",
  shareLine: "{marks} {score} in {time}",
  cardLost: "Not this time",
  cardNoMistakes: "no mistakes",
  cardUnsolved: "Unsolved · {time}",
  nextLevel: "Next level",
  backToWorlds: "Back to worlds",

  dailyName: "Daily Torres",
  dailyBlurb: "A 5×5 city, the same for everyone.",
  inAttempts: { one: "in {count} try", other: "in {count} tries" },
  statAttempts: "Tries",

  howToTitle: "How to play Torres",
  startPlaying: "Start playing",
};
