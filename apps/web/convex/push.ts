"use node";

import webpush, { WebPushError } from "web-push";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

const BATCH = 200;
const payload = JSON.stringify({ title: "Craneá", body: "Ya está la Cifra del día. ¿La sacás en tres intentos?", url: "/cifra/diario" });

/** Envía los recordatorios vencidos. Lo ejecuta el cron cada 15 minutos. */
export const sendDue = internalAction({
  args: {},
  handler: async (ctx) => {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return;
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    const now = Date.now();
    for (let round = 0; round < 25; round++) {
      const due = await ctx.runQuery(internal.reminders.due, { now, limit: BATCH });
      if (!due.length) return;
      const gone: Id<"reminders">[] = [];
      await Promise.all(due.filter((r) => !r.skip).map(async (r) => {
        try {
          await webpush.sendNotification({ endpoint: r.endpoint, keys: r.keys }, payload, { TTL: 6 * 60 * 60, topic: "diario" });
        } catch (error) {
          // 404/410: el navegador dio de baja la suscripción. Otros errores esperan al día siguiente.
          if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) gone.push(r.id);
          else console.warn("No se pudo enviar un recordatorio", error instanceof WebPushError ? error.statusCode : error);
        }
      }));
      await ctx.runMutation(internal.reminders.done, { now, handled: due.map((r) => r.id), gone });
      if (due.length < BATCH) return;
    }
  },
});
