import type { NamespaceShape } from "@cranea/core/i18n";

/** Estadísticas y ranking. */
export const es = {
  played: "Jugadas",
  winRate: "Ganadas",
  bestStreak: "Mejor racha",
  bestTime: "Mejor tiempo",
  byAttempts: "Diarios por intentos",
  empty: "Jugá un diario para ver tu distribución.",
  avgTime: "Tiempo promedio de las ganadas: {time}",
  unsolved: "Sin resolver",

  prevDay: "Día anterior",
  nextDay: "Día siguiente",
  rankingNoAccounts: "El ranking necesita conexión con la cuenta, que no está configurada en esta versión.",
  rankingRules: "Primero quienes ganaron, después menos intentos y menos tiempo. Cuenta la primera partida del día, con el tiempo medido por el servidor.",
  rankingEmpty: "Todavía no hay resultados para este día.",
  rankingSignIn: "Iniciar sesión para aparecer",
  you: "(vos)",
  triesShort: { one: "{count} int.", other: "{count} int." },
  players: { one: "{count} jugador", other: "{count} jugadores" },
  playersMore: { one: "{count} jugador o más", other: "{count} jugadores o más" },
};

export const en: NamespaceShape<typeof es> = {
  played: "Played",
  winRate: "Won",
  bestStreak: "Best streak",
  bestTime: "Best time",
  byAttempts: "Dailies by tries",
  empty: "Play a daily to see your distribution.",
  avgTime: "Average time on wins: {time}",
  unsolved: "Unsolved",

  prevDay: "Previous day",
  nextDay: "Next day",
  rankingNoAccounts: "The leaderboard needs accounts, which aren't set up in this version.",
  rankingRules: "Winners first, then fewest tries and fastest time. Only your first game of the day counts, timed by the server.",
  rankingEmpty: "No results for this day yet.",
  rankingSignIn: "Sign in to show up here",
  you: "(you)",
  triesShort: { one: "{count} try", other: "{count} tries" },
  players: { one: "{count} player", other: "{count} players" },
  playersMore: { one: "{count}+ player", other: "{count}+ players" },
};
