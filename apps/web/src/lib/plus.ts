import { create } from "zustand";
import { useHydrated } from "@/hooks/use-hydrated";

/** Precio de referencia; el real lo ponen las tiendas. */
export const PLUS_PRICE = "desde USD 1,99/mes";

/** Páginas de la app en las tiendas. Vacías no se muestran. */
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? "";
export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "";

/** Lo que suma Plus, para la hoja y /plus. */
export const PLUS_BENEFITS = [
  "Todos los niveles y mundos de los cinco juegos",
  "El archivo: jugá los diarios que te perdiste",
  "Pistas sin límite",
  "Sin publicidad en la app",
] as const;

/** Pistas gratis por tablero sin Plus. */
export const FREE_HINTS = 1;

const CACHE_KEY = "cranea-plus";
/** Solo en desarrollo: "1" fuerza Plus, "0" lo saca. */
const DEV_KEY = "cranea-plus-dev";

type Cached = { plus: boolean; expiresAt: number | null };

interface PlusState {
  plus: boolean;
  /** false mientras no se sabe (sesión sin respuesta de Convex ni dato guardado). */
  ready: boolean;
}

function devOverride(): boolean | null {
  if (process.env.NODE_ENV !== "development") return null;
  const v = localStorage.getItem(DEV_KEY);
  return v === "1" ? true : v === "0" ? false : null;
}

function readCache(): Cached | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as Cached | null;
    return c && typeof c.plus === "boolean" ? c : null;
  } catch {
    return null;
  }
}

const valid = (c: Cached | null) => Boolean(c?.plus && (c.expiresAt === null || c.expiresAt > Date.now()));

/**
 * Al cargar: si el dispositivo ya sabía que había Plus, se usa enseguida para no mostrar
 * candados de más. Si no, sin cuenta posible es gratis; con cuenta, espera a `PlusSync`.
 */
function initial(accounts: boolean): PlusState {
  if (typeof window === "undefined") return { plus: false, ready: false };
  const forced = devOverride();
  if (forced !== null) return { plus: forced, ready: true };
  if (valid(readCache())) return { plus: true, ready: true };
  return { plus: false, ready: !accounts };
}

export const usePlusStore = create<PlusState>(() => initial(Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)));

/** Respuesta de `api.entitlements.mine`: null sin sesión. */
export function applyEntitlement(e: Cached | null) {
  if (e) localStorage.setItem(CACHE_KEY, JSON.stringify({ plus: e.plus, expiresAt: e.expiresAt }));
  else localStorage.removeItem(CACHE_KEY);
  const forced = devOverride();
  usePlusStore.setState({ plus: forced ?? valid(e), ready: true });
}

/** La cuenta no respondió a tiempo (sin conexión): se sigue con lo guardado o gratis. */
export function settleEntitlement() {
  if (!usePlusStore.getState().ready) usePlusStore.setState({ plus: devOverride() ?? valid(readCache()), ready: true });
}

/** Si hay Craneá Plus. Antes de hidratar (y del primer dato) devuelve `ready: false`. */
export function usePlus(): PlusState {
  const hydrated = useHydrated();
  const plus = usePlusStore((s) => s.plus);
  const ready = usePlusStore((s) => s.ready);
  return hydrated ? { plus, ready } : { plus: false, ready: false };
}

/** Pasos de pista ya vistos en un tablero (por id), para el límite gratis. No se borran al reintentar. */
const hintsKey = (id: string) => `cranea-pistas:${id}`;
export function freeHintSteps(id: string): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(hintsKey(id)) ?? "[]");
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}
export const addFreeHintStep = (id: string, step: number) => localStorage.setItem(hintsKey(id), JSON.stringify([...new Set([...freeHintSteps(id), step])]));
