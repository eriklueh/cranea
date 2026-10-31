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
<<<<<<< HEAD
  /** Apodo público y si el jugador quiere aparecer en los rankings. */
  profiles: defineTable({
    userId: v.string(),
    nickname: v.string(),
    ranked: v.boolean(),
  }).index("by_user", ["userId"]),
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
=======
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
>>>>>>> t3/daily-challenge-push-reminders
});
