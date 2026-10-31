import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { userId, valid } from "./progress";
import { publicName, rankable, type Result } from "./results";

const TOP = 10;
/** Cuántas partidas del día se leen como máximo para ubicar a cada jugador. */
const SCAN = 5000;

/** Copia el diario guardado al ranking si es una partida creíble de ese día. */
export async function publishDaily(ctx: MutationCtx, user: string, gameId: string, date: string, r: Result) {
  if (!valid(r) || !rankable(date, r)) return;
  const row = { won: r.won, attempts: r.attempts, timeMs: r.timeMs, at: r.at };
  const existing = await ctx.db
    .query("dailyResults")
    .withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", gameId).eq("date", date))
    .unique();
  if (!existing) await ctx.db.insert("dailyResults", { userId: user, gameId, date, ...row });
  // Vale la primera partida del día: una repetición posterior nunca reemplaza a la original.
  else if (r.at < existing.at) await ctx.db.patch(existing._id, row);
}

async function publishAll(ctx: MutationCtx, user: string) {
  const rows = await ctx.db.query("progress").withIndex("by_user", (q) => q.eq("userId", user)).collect();
  for (const row of rows) if (row.kind === "daily") await publishDaily(ctx, user, row.gameId, row.key, row.result);
}

/**
 * Mantiene el nombre de la cuenta al día y devuelve si el jugador aparece en el ranking.
 * Con sesión se aparece por defecto; al crear el perfil entran los diarios ya jugados.
 */
export async function syncProfile(ctx: MutationCtx, user: string): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  const name = identity ? publicName(identity) : "Jugador";
  const existing = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user)).unique();
  if (!existing) {
    await ctx.db.insert("profiles", { userId: user, name, ranked: true });
    await publishAll(ctx, user);
    return true;
  }
  if (existing.name !== name) await ctx.db.patch(existing._id, { name });
  return existing.ranked;
}

/** Cómo aparecés en el ranking. */
export const profile = query({
  args: {},
  handler: async (ctx) => {
    const user = await userId(ctx);
    if (!user) return null;
    const identity = await ctx.auth.getUserIdentity();
    const p = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user)).unique();
    return { name: identity ? publicName(identity) : (p?.name ?? "Jugador"), ranked: p?.ranked ?? true };
  },
});

/** Aparecer o no en el ranking. Al salir se borran tus partidas publicadas; al volver, entran otra vez. */
export const setRanked = mutation({
  args: { ranked: v.boolean() },
  handler: async (ctx, { ranked }) => {
    const user = await userId(ctx);
    if (!user) throw new Error("Necesitás iniciar sesión.");
    const was = await syncProfile(ctx, user);
    const p = (await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user)).unique())!;
    await ctx.db.patch(p._id, { ranked });
    if (!ranked) {
      const published = await ctx.db.query("dailyResults").withIndex("by_user", (q) => q.eq("userId", user)).collect();
      for (const row of published) await ctx.db.delete(row._id);
    } else if (!was) await publishAll(ctx, user);
  },
});

/** Ranking del día: primero quienes ganaron, después menos intentos y menos tiempo. */
export const day = query({
  args: { gameId: v.string(), date: v.string() },
  handler: async (ctx, { gameId, date }) => {
    const user = await userId(ctx);
    const byDay = (won: boolean, n: number) =>
      ctx.db.query("dailyResults").withIndex("by_day", (q) => q.eq("gameId", gameId).eq("date", date).eq("won", won)).take(n);
    const winners = await byDay(true, SCAN);
    const rows = winners.length < SCAN ? [...winners, ...(await byDay(false, SCAN - winners.length))] : winners;

    const entry = async (row: (typeof rows)[number], index: number) => {
      const p = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", row.userId)).unique();
      return {
        rank: index + 1,
        name: p?.name ?? p?.nickname ?? "Jugador",
        won: row.won,
        attempts: row.attempts,
        timeMs: row.timeMs,
        mine: row.userId === user,
      };
    };
    const top = await Promise.all(rows.slice(0, TOP).map(entry));
    const index = user ? rows.findIndex((r) => r.userId === user) : -1;
    const me = index >= TOP ? await entry(rows[index], index) : null;
    return { top, me, total: rows.length, capped: rows.length >= SCAN };
  },
});
