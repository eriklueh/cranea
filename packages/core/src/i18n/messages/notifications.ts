import type { NamespaceShape } from "../translate";

/** Recordatorios del diario: los locales de la app y los push de la web (convex/push.ts). */
export const es = {
  title: "Craneá",
  streak: { one: "Tu racha de {count} día te espera 🔥", other: "Tu racha de {count} días te espera 🔥" },
  today: "Ya están los desafíos de hoy",
  pushCifra: "Ya está la Cifra del día. ¿La sacás en tres intentos?",
  channel: "Recordatorio del diario",
};

export const en: NamespaceShape<typeof es> = {
  title: "Craneá",
  streak: { one: "Your {count}-day streak is waiting 🔥", other: "Your {count}-day streak is waiting 🔥" },
  today: "Today's puzzles are ready",
  pushCifra: "Today's Cifra is up. Can you crack it in three tries?",
  channel: "Daily reminder",
};
