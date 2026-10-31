import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { userId, valid } from "./progress";
import { publicName, rankable, type Result } from "./results";

const TOP = 10;
/** Cuántas partidas del día se leen como máximo para ubicar a cada jugador. */
const SCAN = 5000;

/** Menos que esto no es una partida creíble (abrir, leer y resolver). */
const MIN_MS: Record<string, number> = { cifra: 10_000, palabra: 8_000, puentes: 10_000, nonograma: 15_000, torres: 12_000 };
/** Tolerancia entre el reloj del dispositivo y el del servidor. */
const CLOCK_SKEW_MS = 10 * 60_000;

const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

type Start = Doc<"dailyStarts">;

const findStart = (ctx: QueryCtx | MutationCtx, user: string, gameId: string, date: string) =>
  ctx.db.query("dailyStarts").withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", gameId).eq("date", date)).unique();

/** Abre el intento oficial del diario (solo el primero cuenta). Se llama al mostrar el tablero. */
export const startDaily = mutation({
  args: { gameId: v.string(), date: v.string() },
  handler: async (ctx, { gameId, date }) => {
    const user = await userId(ctx);
    if (!user || gameId.length > 40) return;
    // Solo el diario de hoy (o el de ayer, para quien empezó justo antes de medianoche).
    const now = Date.now();
    if (date !== utcDay(now) && date !== utcDay(now - 2 * 3_600_000)) return;
    if (await findStart(ctx, user, gameId, date)) return;
    await ctx.db.insert("dailyStarts", { userId: user, gameId, date, startedAt: now });
  },
});

/** Cierra el intento oficial con el primer resultado que llega después de abrirlo. */
export async function finishDaily(ctx: MutationCtx, user: string, gameId: string, date: string, r: Result): Promise<Start | null> {
  const start = await findStart(ctx, user, gameId, date);
  if (!start || start.finishedAt !== undefined) return start;
  // Un resultado jugado antes de abrir el intento (en otro dispositivo, sin sesión) no lo cierra.
  if (!valid(r) || r.at < start.startedAt - CLOCK_SKEW_MS) return start;
  const finished = { finishedAt: Date.now(), won: r.won, attempts: r.attempts };
  await ctx.db.patch(start._id, finished);
  return { ...start, ...finished };
}

/**
 * Publica el intento oficial. El tiempo del ranking lo mide el servidor, desde que se abrió
 * el tablero hasta que llegó el resultado: el reloj del dispositivo no cuenta.
 */
export async function publishDaily(ctx: MutationCtx, user: string, start: Start | null) {
  if (!start || start.finishedAt === undefined || start.won === undefined || start.attempts === undefined) return;
  const timeMs = start.finishedAt - start.startedAt;
  const official = { won: start.won, attempts: start.attempts, timeMs, at: start.finishedAt };
  if (!valid(official) || !rankable(start.date, official) || timeMs < (MIN_MS[start.gameId] ?? 8_000)) return;
  const existing = await ctx.db
    .query("dailyResults")
    .withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", start.gameId).eq("date", start.date))
    .unique();
  if (!existing) await ctx.db.insert("dailyResults", { userId: user, gameId: start.gameId, date: start.date, ...official });
}

async function publishAll(ctx: MutationCtx, user: string) {
  const starts = await ctx.db.query("dailyStarts").withIndex("by_user", (q) => q.eq("userId", user)).collect();
  for (const start of starts) await publishDaily(ctx, user, start);
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
