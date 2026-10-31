import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const kind = v.union(v.literal("level"), v.literal("daily"));
export const result = v.object({ won: v.boolean(), attempts: v.number(), timeMs: v.number(), at: v.number() });

export default defineSchema({
  /**
   * Craneá Plus. Lo escribe el webhook de RevenueCat (compras en App Store / Play Store)
   * o un administrador. `subject` es el id de usuario de Clerk, que la app usa como appUserID.
   */
  entitlements: defineTable({
    subject: v.string(),
    plus: v.boolean(),
    /** Vencimiento en ms; sin valor, no vence (por ejemplo, otorgado a mano). */
    expiresAt: v.optional(v.number()),
    source: v.string(),
    productId: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_subject", ["subject"]),
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
  /**
   * Totales de cada jugador por tablero y período, recalculados desde `dailyResults` cada vez que
   * se publica un diario. `gameId` es un juego o "all" (General); `period` es "2026-10-31" (solo
   * General), "2026-W44" o "2026-10". Puntos en `convex/scoring.ts`.
   */
  periodScores: defineTable({
    userId: v.string(),
    gameId: v.string(),
    period: v.string(),
    points: v.number(),
    wins: v.number(),
    played: v.number(),
    timeMs: v.number(),
    /** Puntos, resueltos y menos tiempo en un solo número, para ordenar con el índice. */
    order: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entry", ["userId", "gameId", "period"])
    .index("by_board", ["gameId", "period", "order"]),
  /** Logros desbloqueados (se evalúan en el dispositivo; acá viajan entre dispositivos). */
  achievements: defineTable({
    userId: v.string(),
    achievementId: v.string(),
    /** Cuándo se desbloqueó (ms). Entre dispositivos vale el más antiguo. */
    at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entry", ["userId", "achievementId"]),
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
