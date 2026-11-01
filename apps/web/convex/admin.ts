import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, query, type ActionCtx, type QueryCtx } from "./_generated/server";
import { setPlus } from "./entitlements";

/** Emails con acceso a /admin, separados por coma (variable ADMIN_EMAILS de Convex). */
function admins(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

async function adminEmail(ctx: QueryCtx | ActionCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.toLowerCase();
  return email && admins().includes(email) ? email : null;
}

export const isAdmin = query({ args: {}, handler: async (ctx) => Boolean(await adminEmail(ctx)) });

/** Regalos de Plus hechos desde /admin, los más nuevos primero. */
export const grants = query({
  args: {},
  handler: async (ctx) => {
    if (!(await adminEmail(ctx))) return null;
    const rows = await ctx.db.query("entitlements").withIndex("by_source", (q) => q.eq("source", "admin")).collect();
    const now = Date.now();
    return rows
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((r) => ({
        subject: r.subject,
        email: r.email ?? r.subject,
        expiresAt: r.expiresAt ?? null,
        active: r.plus && (r.expiresAt === undefined || r.expiresAt > now),
        updatedAt: r.updatedAt,
      }));
  },
});

/** Busca la cuenta de Clerk por email con la API de Clerk (CLERK_SECRET_KEY de Convex). */
async function clerkUserByEmail(email: string): Promise<string | null> {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new Error("Falta CLERK_SECRET_KEY en Convex.");
  const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}&limit=1`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error("No se pudo consultar Clerk.");
  const users = (await res.json()) as { id: string }[];
  return users[0]?.id ?? null;
}

/** Da o saca Plus gratis a una cuenta por su email. `days` null = sin vencimiento. */
export const setPlusByEmail = action({
  args: { email: v.string(), plus: v.boolean(), days: v.union(v.number(), v.null()) },
  handler: async (ctx, { email, plus, days }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const by = await adminEmail(ctx);
    if (!by) return { ok: false, error: "No tenés permiso para esto." };
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, error: "Ese email no es válido." };
    const subject = await clerkUserByEmail(clean);
    if (!subject) return { ok: false, error: "No hay ninguna cuenta de Craneá con ese email. Tiene que iniciar sesión al menos una vez." };
    await ctx.runMutation(internal.admin.apply, {
      subject,
      email: clean,
      grantedBy: by,
      plus,
      expiresAt: plus && days ? Date.now() + days * 86_400_000 : undefined,
    });
    return { ok: true };
  },
});

export const apply = internalMutation({
  args: { subject: v.string(), email: v.string(), grantedBy: v.string(), plus: v.boolean(), expiresAt: v.optional(v.number()) },
  handler: async (ctx, a) => {
    await setPlus(ctx, a.subject, { plus: a.plus, expiresAt: a.expiresAt, source: "admin", email: a.email, grantedBy: a.grantedBy });
  },
});
