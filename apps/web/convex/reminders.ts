import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { nextReminder, validMinutes } from "./schedule";

const locale = v.optional(v.union(v.literal("es"), v.literal("en")));
const subscription = v.object({ endpoint: v.string(), keys: v.object({ p256dh: v.string(), auth: v.string() }) });
/** Si el envío se atrasó más que esto (cron caído), se saltea el día en vez de avisar tarde. */
const STALE_MS = 2 * 60 * 60 * 1000;

/** Hora elegida para este dispositivo, o null si no tiene recordatorio. */
export const status = query({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const row = await ctx.db.query("reminders").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).unique();
    return row ? { minutes: row.minutes } : null;
  },
});

/** Activa o actualiza el recordatorio del dispositivo; con sesión iniciada, queda asociado a la cuenta. */
export const subscribe = mutation({
  args: { subscription, minutes: v.number(), timeZone: v.string(), offset: v.number(), locale },
  handler: async (ctx, { subscription: { endpoint, keys }, minutes, timeZone, offset, locale }) => {
    if (!validMinutes(minutes)) throw new Error("Hora inválida.");
    if (!endpoint.startsWith("https://") || endpoint.length > 1000 || keys.p256dh.length > 200 || keys.auth.length > 100) throw new Error("Suscripción inválida.");
    if (timeZone.length > 64 || !Number.isInteger(offset) || Math.abs(offset) > 18 * 60) throw new Error("Zona horaria inválida.");
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
    const row = { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId, minutes, timeZone, offset, nextAt: nextReminder(Date.now(), minutes, timeZone, offset), ...(locale ? { locale } : {}) };
    const existing = await ctx.db.query("reminders").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).unique();
    if (existing) await ctx.db.replace(existing._id, row);
    else await ctx.db.insert("reminders", row);
  },
});

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const existing = await ctx.db.query("reminders").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Recordatorios vencidos. `skip` marca a quien ya jugó el diario de hoy o a los atrasados. */
export const due = internalQuery({
  args: { now: v.number(), limit: v.number() },
  handler: async (ctx, { now, limit }) => {
    const today = new Date(now).toISOString().slice(0, 10);
    const rows = await ctx.db.query("reminders").withIndex("by_next", (q) => q.lte("nextAt", now)).take(limit);
    return await Promise.all(rows.map(async (row) => {
      const played = row.userId && await ctx.db
        .query("progress")
        .withIndex("by_entry", (q) => q.eq("userId", row.userId!).eq("gameId", "cifra").eq("kind", "daily").eq("key", today))
        .first();
      return { id: row._id, endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth }, locale: row.locale ?? "es", skip: !!played || now - row.nextAt > STALE_MS };
    }));
  },
});

/** Reprograma los atendidos para el día siguiente y borra las suscripciones que ya no existen. */
export const done = internalMutation({
  args: { now: v.number(), handled: v.array(v.id("reminders")), gone: v.array(v.id("reminders")) },
  handler: async (ctx, { now, handled, gone }) => {
    const removed = new Set(gone);
    for (const id of gone) if (await ctx.db.get(id)) await ctx.db.delete(id);
    for (const id of handled) {
      if (removed.has(id)) continue;
      const row = await ctx.db.get(id);
      if (row && row.nextAt <= now) await ctx.db.patch(id, { nextAt: nextReminder(now, row.minutes, row.timeZone, row.offset) });
    }
  },
});
