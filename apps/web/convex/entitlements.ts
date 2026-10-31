import { v } from "convex/values";
import { internalMutation, query, type MutationCtx } from "./_generated/server";

/** Identificador del entitlement en RevenueCat. */
export const PLUS = "plus";

const active = (e: { plus: boolean; expiresAt?: number } | null, now: number) => Boolean(e?.plus && (e.expiresAt === undefined || e.expiresAt > now));

/** Si el jugador tiene Craneá Plus. Sin sesión, null. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const e = await ctx.db.query("entitlements").withIndex("by_subject", (q) => q.eq("subject", identity.subject)).unique();
    return { plus: active(e, Date.now()), expiresAt: e?.expiresAt ?? null };
  },
});

export async function setPlus(ctx: MutationCtx, subject: string, data: { plus: boolean; expiresAt?: number; source: string; productId?: string }) {
  const existing = await ctx.db.query("entitlements").withIndex("by_subject", (q) => q.eq("subject", subject)).unique();
  const row = { subject, ...data, updatedAt: Date.now() };
  if (existing) await ctx.db.replace(existing._id, row);
  else await ctx.db.insert("entitlements", row);
}

/** Para dar o sacar Plus a mano: `npx convex run entitlements:grant '{"subject":"user_...","days":30}'`. */
export const grant = internalMutation({
  args: { subject: v.string(), days: v.optional(v.number()), plus: v.optional(v.boolean()) },
  handler: async (ctx, { subject, days, plus = true }) => {
    await setPlus(ctx, subject, { plus, expiresAt: days ? Date.now() + days * 86_400_000 : undefined, source: "admin" });
  },
});

/** Evento del webhook de RevenueCat, ya autenticado. */
export const applyRevenueCat = internalMutation({
  args: {
    type: v.string(),
    appUserIds: v.array(v.string()),
    entitlementIds: v.array(v.string()),
    expiresAt: v.optional(v.number()),
    productId: v.optional(v.string()),
    transferredFrom: v.optional(v.array(v.string())),
  },
  handler: async (ctx, a) => {
    // Solo ids de Clerk: los anónimos de RevenueCat ($RCAnonymousID) no tienen cuenta.
    const subjects = a.appUserIds.filter((id) => id.startsWith("user_"));
    if (a.type === "TRANSFER") {
      for (const from of (a.transferredFrom ?? []).filter((id) => id.startsWith("user_"))) await setPlus(ctx, from, { plus: false, source: "revenuecat" });
    }
    if (a.type === "TEST" || !subjects.length) return;
    const hasPlus = a.entitlementIds.includes(PLUS) || a.entitlementIds.length === 0;
    // Una cancelación sigue activa hasta el vencimiento; EXPIRATION la corta.
    const plus = a.type !== "EXPIRATION" && hasPlus;
    for (const subject of subjects) await setPlus(ctx, subject, { plus, expiresAt: a.expiresAt, source: "revenuecat", productId: a.productId });
  },
});
