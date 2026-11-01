import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

/**
 * Borra todo lo que Craneá guarda de la cuenta (progreso, perfil, ranking, logros, Plus y avisos).
 * Se llama justo antes de borrar la cuenta en Clerk, desde la app o la web. El progreso que quedó
 * en el dispositivo no se toca.
 */
export const deleteData = internalMutation({
  args: { user: v.string(), subject: v.string() },
  handler: async (ctx, { user, subject }) => {
    const byUser = ["progress", "profiles", "dailyStarts", "dailyResults", "periodScores", "achievements"] as const;
    let removed = 0;
    for (const table of byUser) {
      const rows = await ctx.db.query(table).withIndex("by_user", (q) => q.eq("userId", user)).collect();
      for (const row of rows) await ctx.db.delete(row._id);
      removed += rows.length;
    }
    const plus = await ctx.db.query("entitlements").withIndex("by_subject", (q) => q.eq("subject", subject)).collect();
    for (const row of plus) await ctx.db.delete(row._id);
    // Los avisos siguen llegando al dispositivo, pero sin quedar atados a la cuenta.
    for (const r of await ctx.db.query("reminders").collect()) if (r.userId === user) await ctx.db.patch(r._id, { userId: undefined });
    return { removed: removed + plus.length };
  },
});

/** Borra los datos y después la cuenta en Clerk (con CLERK_SECRET_KEY de Convex). La app y la web cierran sesión al terminar. */
export const deleteMyAccount = action({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Necesitás iniciar sesión.");
    await ctx.runMutation(internal.account.deleteData, { user: identity.tokenIdentifier, subject: identity.subject });
    const key = process.env.CLERK_SECRET_KEY;
    if (!key) throw new Error("Falta CLERK_SECRET_KEY en Convex.");
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(identity.subject)}`, { method: "DELETE", headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok && res.status !== 404) throw new Error("No se pudo borrar la cuenta en Clerk.");
    return { ok: true };
  },
});
