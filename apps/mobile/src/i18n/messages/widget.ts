import type { NamespaceShape } from "@cranea/core/i18n";

/**
 * Widget «Diarios de hoy» de Android (src/widget). Corto: entra en 2×1.
 * El nombre y la descripción del selector de widgets son recursos de Android: van en
 * plugins/with-daily-widget.js (no se pueden leer de acá al compilar).
 */
export const es = {
  title: "Diarios de hoy",
  progress: "{done}/{total}",
  allDone: "¡Listo por hoy!",
  allDoneSub: "Mañana hay más.",
  play: "Jugar {game}",
  next: "Seguí con {game}",
  streakA11y: { one: "Racha de {count} día", other: "Racha de {count} días" },
  protectorsA11y: { one: "{count} protector de racha", other: "{count} protectores de racha" },
  statusWon: "{game}: resuelto",
  statusLost: "{game}: no salió",
  statusPending: "{game}: por jugar",
  a11y: "Diarios de hoy: {done} de {total}. {action}",
  openHome: "Abrir Craneá",
};

export const en: NamespaceShape<typeof es> = {
  title: "Today's puzzles",
  progress: "{done}/{total}",
  allDone: "All done for today!",
  allDoneSub: "More tomorrow.",
  play: "Play {game}",
  next: "Next: {game}",
  streakA11y: { one: "{count}-day streak", other: "{count}-day streak" },
  protectorsA11y: { one: "{count} streak shield", other: "{count} streak shields" },
  statusWon: "{game}: solved",
  statusLost: "{game}: missed",
  statusPending: "{game}: to play",
  a11y: "Today's puzzles: {done} of {total}. {action}",
  openHome: "Open Craneá",
};
