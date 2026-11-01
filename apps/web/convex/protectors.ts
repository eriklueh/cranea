import { v } from "convex/values";
import { mergeProtectors, sameProtectors, type ProtectorState } from "@cranea/core/protectors";
import { mutation, query } from "./_generated/server";
import { userId } from "./progress";

const state = v.object({ since: v.string(), plus: v.array(v.string()), seen: v.array(v.string()) });

/** Protectores de racha de la cuenta (solo el estado mínimo; el stock se calcula en el dispositivo). */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await userId(ctx);
    if (!user) return null;
    const row = await ctx.db.query("protectors").withIndex("by_user", (q) => q.eq("userId", user)).unique();
    return row ? { since: row.since, plus: row.plus, seen: row.seen } : null;
  },
});

/** Combina lo del dispositivo con lo de la cuenta (`mergeProtectors`: conmutativa e idempotente). */
export const save = mutation({
  args: { state },
  handler: async (ctx, args) => {
    const user = await userId(ctx);
    if (!user) throw new Error("Necesitás iniciar sesión para guardar tus protectores.");
    if (args.state.plus.length > 120 || args.state.seen.length > 400) throw new Error("Demasiados datos.");
    const row = await ctx.db.query("protectors").withIndex("by_user", (q) => q.eq("userId", user)).unique();
    const current: ProtectorState | undefined = row ? { since: row.since, plus: row.plus, seen: row.seen } : undefined;
    const next = mergeProtectors(current, args.state);
    if (!next || sameProtectors(next, current)) return;
    if (row) await ctx.db.patch(row._id, next);
    else await ctx.db.insert("protectors", { userId: user, ...next });
  },
});
