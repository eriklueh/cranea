import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const kind = v.union(v.literal("level"), v.literal("daily"));
export const result = v.object({ won: v.boolean(), attempts: v.number(), timeMs: v.number(), at: v.number() });

export default defineSchema({
  progress: defineTable({
    userId: v.string(),
    gameId: v.string(),
    kind,
    key: v.string(),
    result,
  })
    .index("by_user", ["userId"])
    .index("by_entry", ["userId", "gameId", "kind", "key"]),
  /** Nombre público (de la cuenta de Clerk) y si el jugador aparece en los rankings. */
  profiles: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    /** Apodo de la primera versión del ranking; ya no se muestra. */
    nickname: v.optional(v.string()),
    ranked: v.boolean(),
  }).index("by_user", ["userId"]),
  /**
   * Intento oficial de cada diario: lo registra el servidor al abrir el tablero por primera vez
   * con sesión, y se cierra con el primer resultado que llega. Solo este intento entra al ranking.
   */
  dailyStarts: defineTable({
    userId: v.string(),
    gameId: v.string(),
    date: v.string(),
    /** Hora del servidor al abrir el tablero. */
    startedAt: v.number(),
    /** Hora del servidor al recibir el primer resultado. */
    finishedAt: v.optional(v.number()),
    won: v.optional(v.boolean()),
    attempts: v.optional(v.number()),
  })
    .index("by_entry", ["userId", "gameId", "date"])
    .index("by_user", ["userId"]),
  /** Diarios de quienes aparecen en el ranking. Se copian desde `progress` al guardar o al sumarse. */
  dailyResults: defineTable({
    userId: v.string(),
    gameId: v.string(),
    date: v.string(),
    won: v.boolean(),
    attempts: v.number(),
    timeMs: v.number(),
    at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entry", ["userId", "gameId", "date"])
    .index("by_day", ["gameId", "date", "won", "attempts", "timeMs"]),
  /** Suscripciones Web Push al recordatorio del diario. Sin sesión, se identifican solo por el endpoint. */
  reminders: defineTable({
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userId: v.optional(v.string()),
    /** Minutos desde la medianoche local. */
    minutes: v.number(),
    timeZone: v.string(),
    /** Desfase local respecto de UTC en minutos, por si la zona no se reconoce. */
    offset: v.number(),
    /** Próximo envío (ms UTC). */
    nextAt: v.number(),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_next", ["nextAt"]),
});
