import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * Webhook de RevenueCat. En RevenueCat → Integrations → Webhooks, URL
 * https://<deployment>.convex.site/revenuecat y en "Authorization header" el valor de
 * la variable REVENUECAT_WEBHOOK_AUTH de Convex.
 */
http.route({
  path: "/revenuecat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
    if (!expected || request.headers.get("Authorization") !== expected) return new Response("No autorizado", { status: 401 });
    const body = (await request.json().catch(() => null)) as { event?: Record<string, unknown> } | null;
    const e = body?.event;
    if (!e || typeof e.type !== "string") return new Response("Evento inválido", { status: 400 });
    const strings = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : []);
    const ids = [...new Set([e.app_user_id, e.original_app_user_id, ...strings(e.aliases)].filter((s): s is string => typeof s === "string"))];
    await ctx.runMutation(internal.entitlements.applyRevenueCat, {
      type: e.type,
      appUserIds: ids,
      entitlementIds: strings(e.entitlement_ids),
      expiresAt: typeof e.expiration_at_ms === "number" ? e.expiration_at_ms : undefined,
      productId: typeof e.product_id === "string" ? e.product_id : undefined,
      transferredFrom: strings(e.transferred_from),
    });
    return new Response("ok");
  }),
});

export default http;
