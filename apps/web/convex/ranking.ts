import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { userId, valid } from "./progress";
import { cleanNickname, rankable, type Result } from "./results";

const TOP = 10;
/** Cuántas partidas del día se leen como máximo para ubicar a cada jugador. */
const SCAN = 5000;

export async function rankedProfile(ctx: QueryCtx | MutationCtx, user: string) {
  const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user)).unique();
  return profile?.ranked ? profile : null;
}

/** Copia el diario guardado al ranking si es una partida creíble de ese día. */
export async function publishDaily(ctx: MutationCtx, user: string, gameId: string, date: string, r: Result) {
  if (!valid(r) || !rankable(date, r)) return;
  const row = { won: r.won, attempts: r.attempts, timeMs: r.timeMs, at: r.at };
  const existing = await ctx.db
    .query("dailyResults")
    .withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", gameId).eq("date", date))
    .unique();
  if (!existing) await ctx.db.insert("dailyResults", { userId: user, gameId, date, ...row });
  else if (existing.at !== r.at) await ctx.db.patch(existing._id, row);
}

/** Tu apodo y si aparecés en el ranking. */
export const profile = query({
  args: {},
  handler: async (ctx) => {
    const user = await userId(ctx);
    if (!user) return null;
    const p = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user)).unique();
    return p ? { nickname: p.nickname, ranked: p.ranked } : null;
  },
});

/** Guarda el apodo y la preferencia. Al sumarse, entran los diarios ya jugados; al salir, se borran. */
export const setProfile = mutation({
  args: { nickname: v.string(), ranked: v.boolean() },
  handler: async (ctx, args) => {
    const user = await userId(ctx);
    if (!user) throw new Error("Necesitás iniciar sesión.");
    const nickname = cleanNickname(args.nickname);
    if (!nickname) throw new Error("Ese apodo no es válido.");
    const existing = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user)).unique();
    if (existing) await ctx.db.patch(existing._id, { nickname, ranked: args.ranked });
    else await ctx.db.insert("profiles", { userId: user, nickname, ranked: args.ranked });

    if (!args.ranked) {
      const published = await ctx.db.query("dailyResults").withIndex("by_user", (q) => q.eq("userId", user)).collect();
      for (const row of published) await ctx.db.delete(row._id);
      return;
    }
    if (existing?.ranked) return;
    const rows = await ctx.db.query("progress").withIndex("by_user", (q) => q.eq("userId", user)).collect();
    for (const row of rows) if (row.kind === "daily") await publishDaily(ctx, user, row.gameId, row.key, row.result);
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
        nickname: p?.nickname ?? "Anónimo",
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
