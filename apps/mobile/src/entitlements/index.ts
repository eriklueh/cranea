import { create } from "zustand";

/**
 * Punto único para saber qué tiene habilitado la persona. Hoy todo es gratis y no hay compras
 * ni anuncios: el modelo lo decide el dueño (ver docs/mobile.md → Monetización).
 *
 * Cuando haya un modelo, este módulo es lo único que cambia: por ejemplo RevenueCat
 * (`Purchases.getCustomerInfo()` → `entitlements.active.plus`) para una suscripción o un pago único
 * "Craneá Plus", y AdMob para anuncios con recompensa. Las pantallas solo preguntan `useEntitlements()`
 * o `can(...)`, nunca a la tienda directamente.
 */
export type Entitlement =
  /** Craneá Plus: sin anuncios, todos los mundos, estadísticas extendidas… (a definir). */
  | "plus";

export type Feature =
  | "all-worlds"
  | "unlimited-hints"
  | "no-ads"
  | "archive";

interface EntitlementsState {
  active: ReadonlySet<Entitlement>;
  /** Se completa cuando haya un proveedor de compras. */
  refresh: () => Promise<void>;
}

export const useEntitlements = create<EntitlementsState>(() => ({
  active: new Set<Entitlement>(),
  refresh: async () => {},
}));

/** Qué funciones requiere cada entitlement. Vacío = todo libre (estado actual). */
const REQUIRES: Partial<Record<Feature, Entitlement>> = {};

export function can(feature: Feature, active: ReadonlySet<Entitlement> = useEntitlements.getState().active) {
  const needed = REQUIRES[feature];
  return !needed || active.has(needed);
}
