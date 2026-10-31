import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userId } from "./progress";

const MAX_BATCH = 100;

/** Logros de la cuenta. Se calculan en el dispositivo; acá se guardan para no perderlos al cambiar de equipo. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await userId(ctx);
    if (!user) return null;
    const rows = await ctx.db.query("achievements").withIndex("by_user", (q) => q.eq("userId", user)).collect();
    return rows.map(({ achievementId, at }) => ({ id: achievementId, at }));
  },
});

/** Suma logros desbloqueados. Entre dispositivos vale la fecha más antigua. */
export const save = mutation({
  args: { items: v.array(v.object({ id: v.string(), at: v.number() })) },
  handler: async (ctx, { items }) => {
    const user = await userId(ctx);
    if (!user) throw new Error("Necesitás iniciar sesión para guardar tus logros.");
    if (items.length > MAX_BATCH) throw new Error("Demasiados logros en un solo envío.");
    for (const { id, at } of items) {
      if (id.length > 40 || !Number.isFinite(at) || at <= 0 || at > Date.now() + 5 * 60_000) continue;
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_entry", (q) => q.eq("userId", user).eq("achievementId", id))
        .unique();
      if (!existing) await ctx.db.insert("achievements", { userId: user, achievementId: id, at });
      else if (at < existing.at) await ctx.db.patch(existing._id, { at });
    }
  },
});
