import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, query, type MutationCtx } from "./_generated/server";
import { userId } from "./progress";
import { OVERALL, RANKED_GAMES, orderKey, periodKey, periodRange, totals, type PeriodKind } from "./scoring";

/**
 * Rankings de semana y mes (por juego y General) y General del día.
 *
 * No se recorren los diarios al consultar: `periodScores` guarda los totales de cada jugador y se
 * recalcula al publicar un diario (`refreshScores`, llamado desde `publishDaily`). Recalcular desde
 * `dailyResults` en lugar de sumar al total lo hace idempotente: publicar dos veces o correr
 * `rebuild` mientras llegan partidas no cuenta nada doble. Cuesta a lo sumo 5 lecturas por índice
 * de ≤ 31 filas por tablero, solo de ese jugador.
 */

const TOP = 10;
/** Cuántos jugadores se cuentan como máximo para ubicarte o mostrar el total. */
const SCAN = 5000;

/** Tableros que toca un diario: el del juego (semana y mes) y el General (día, semana y mes). */
const boards = (gameId: string): { board: string; kind: PeriodKind }[] => [
  { board: gameId, kind: "week" },
  { board: gameId, kind: "month" },
  { board: OVERALL, kind: "day" },
  { board: OVERALL, kind: "week" },
  { board: OVERALL, kind: "month" },
];

/** Recalcula los totales de un jugador en todos los tableros que incluyen ese diario. */
export async function refreshScores(ctx: MutationCtx, user: string, gameId: string, date: string) {
  for (const { board, kind } of boards(gameId)) {
    const period = periodKey(kind, date);
    const { from, to } = periodRange(kind, date);
    const games = board === OVERALL ? RANKED_GAMES : [gameId];
    const rows = [];
    for (const g of games) {
      rows.push(
        ...(await ctx.db
          .query("dailyResults")
          .withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", g).gte("date", from).lte("date", to))
          .collect()),
      );
    }
    const t = totals(rows);
    const existing = await ctx.db
      .query("periodScores")
      .withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", board).eq("period", period))
      .unique();
    if (!t.played) {
      if (existing) await ctx.db.delete(existing._id);
    } else if (existing) await ctx.db.patch(existing._id, { ...t, order: orderKey(t) });
    else await ctx.db.insert("periodScores", { userId: user, gameId: board, period, ...t, order: orderKey(t) });
  }
}

/** Al dejar de aparecer en el ranking. */
export async function clearScores(ctx: MutationCtx, user: string) {
  const rows = await ctx.db.query("periodScores").withIndex("by_user", (q) => q.eq("userId", user)).collect();
  for (const row of rows) await ctx.db.delete(row._id);
}

const kindArg = v.union(v.literal("day"), v.literal("week"), v.literal("month"));

/** Tablero de un período: los 10 primeros y, si estás más abajo, tu fila. */
export const period = query({
  args: { gameId: v.string(), kind: kindArg, date: v.string() },
  handler: async (ctx, { gameId, kind, date }) => {
    const user = await userId(ctx);
    const key = periodKey(kind, date);
    const board = () => ctx.db.query("periodScores").withIndex("by_board", (q) => q.eq("gameId", gameId).eq("period", key));

    const entry = async (row: { userId: string; points: number; wins: number; played: number; timeMs: number }, rank: number) => {
      const p = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", row.userId)).unique();
      return { rank, name: p?.name ?? p?.nickname ?? "Jugador", points: row.points, wins: row.wins, played: row.played, mine: row.userId === user };
    };

    const topRows = await board().order("desc").take(TOP);
    const top = await Promise.all(topRows.map((row, i) => entry(row, i + 1)));
    const counted = await board().take(SCAN);
    let me = null;
    if (user && !topRows.some((r) => r.userId === user)) {
      const mine = await ctx.db
        .query("periodScores")
        .withIndex("by_entry", (q) => q.eq("userId", user).eq("gameId", gameId).eq("period", key))
        .unique();
      if (mine) {
        const ahead = await ctx.db
          .query("periodScores")
          .withIndex("by_board", (q) => q.eq("gameId", gameId).eq("period", key).gt("order", mine.order))
          .take(SCAN);
        me = await entry(mine, ahead.length + 1);
      }
    }
    return { top, me, total: counted.length, capped: counted.length >= SCAN };
  },
});

/**
 * Recalcula todos los tableros desde `dailyResults`, de a páginas. Para los diarios publicados antes
 * de que existieran: `npx convex run leaderboards:rebuild`. Se puede repetir sin riesgo.
 */
export const rebuild = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("dailyResults").paginate({ cursor: cursor ?? null, numItems: 100 });
    const done = new Set<string>();
    for (const row of page.page) {
      const id = `${row.userId}|${row.gameId}|${row.date}`;
      if (done.has(id)) continue;
      done.add(id);
      await refreshScores(ctx, row.userId, row.gameId, row.date);
    }
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.leaderboards.rebuild, { cursor: page.continueCursor });
  },
});
