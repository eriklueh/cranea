import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { publishDaily, rankedProfile } from "./ranking";
import { combine, type Kind, type Result } from "./results";
import { kind, result } from "./schema";

const entry = v.object({ gameId: v.string(), kind, key: v.string(), result });
const MAX_BATCH = 500;

export async function userId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.tokenIdentifier ?? null;
}

export const valid = (r: Result) =>
  Number.isInteger(r.attempts) && r.attempts >= 1 && r.attempts <= 10 && Number.isFinite(r.timeMs) && r.timeMs >= 0 && Number.isFinite(r.at) && r.at > 0;

/** Todo el progreso del jugador, agrupado como en el dispositivo. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await userId(ctx);
    if (!user) return null;
    const rows = await ctx.db.query("progress").withIndex("by_user", (q) => q.eq("userId", user)).collect();
    return rows.map(({ gameId, kind, key, result }) => ({ gameId, kind, key, result }));
  },
});

/** Sube partidas del dispositivo y conserva, por casillero, el resultado que corresponde. */
export const save = mutation({
  args: { entries: v.array(entry) },
  handler: async (ctx, { entries }) => {
    const user = await userId(ctx);
    if (!user) throw new Error("Necesitás iniciar sesión para guardar el progreso.");
    if (entries.length > MAX_BATCH) throw new Error("Demasiadas partidas en un solo envío.");
    const ranked = Boolean(await rankedProfile(ctx, user));
    for (const { gameId, kind, key, result } of entries) {
      if (!valid(result) || gameId.length > 40 || key.length > 40) continue;
      const existing = await ctx.db
        .query("progress")
        .withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", gameId).eq("kind", kind).eq("key", key))
        .unique();
      const next = existing ? combine(kind as Kind, existing.result, result) : result;
      if (!existing) await ctx.db.insert("progress", { userId: user, gameId, kind, key, result });
      else if (next !== existing.result) await ctx.db.patch(existing._id, { result: next });
      if (ranked && kind === "daily") await publishDaily(ctx, user, gameId, key, next);
    }
  },
});
