import { anyApi } from "convex/server";
import type { api as webApi } from "../../../web/convex/_generated/api";

/**
 * La misma API de Convex que la web, con sus tipos: el backend vive en apps/web/convex
 * y la app solo lo consume. En runtime es `anyApi` (igual que el `api.js` generado), así
 * Metro no tiene que resolver `convex` desde la carpeta de la web.
 */
export const api = anyApi as unknown as typeof webApi;

export const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || null;
export const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || null;

/** Sin las dos variables la app funciona sin cuenta: progreso solo en el dispositivo, sin ranking. */
export const accountsEnabled = Boolean(convexUrl && clerkPublishableKey);
