import { Linking, Platform } from "react-native";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { usePlusState } from "@/entitlements";
import { getT, type T } from "@/lib/i18n";
import { purchasesModule } from "./native";

/**
 * Craneá Plus con RevenueCat. El appUserID es el id de Clerk (`user.id`, igual al `subject` de
 * Convex): así el webhook de RevenueCat marca Plus en la cuenta y vale también en la web.
 * Por eso solo se configura con sesión iniciada; sin cuenta no se puede comprar.
 */

/** Entitlement de RevenueCat (el mismo que `PLUS` en apps/web/convex/entitlements.ts). */
export const PLUS_ENTITLEMENT = "plus";

const apiKey = Platform.select({ ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY, android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY }) || null;

/** Si en esta versión se puede comprar: hay módulo nativo (no es Expo Go) y clave de RevenueCat. */
export const purchasesAvailable = () => Boolean(apiKey && purchasesModule());

const Purchases = () => purchasesModule()!.default;

let configured = false;
/** A quién está identificado RevenueCat ahora (null: anónimo o sin configurar). */
let current: string | null = null;
/** Los cambios de cuenta se aplican de a uno, en orden. */
let queue: Promise<void> = Promise.resolve();

function apply(info: CustomerInfo) {
  if (!current) return; // anónimo (después de cerrar sesión): no hay Plus
  const plus = info.entitlements.active[PLUS_ENTITLEMENT];
  const until = plus?.expirationDate ? Date.parse(plus.expirationDate) : null;
  usePlusState.getState().setStore({ active: Boolean(plus), until: Number.isFinite(until) ? until : null }, info.managementURL);
}

/** Al entrar o salir de la cuenta: `logIn` con el id de Clerk, `logOut` al cerrar sesión. */
export function identify(userId: string | null) {
  queue = queue.then(async () => {
    if (!purchasesAvailable() || userId === current) return;
    try {
      if (!configured) {
        if (!userId) return;
        Purchases().configure({ apiKey: apiKey!, appUserID: userId });
        Purchases().addCustomerInfoUpdateListener(apply);
        configured = true;
        current = userId;
        apply(await Purchases().getCustomerInfo());
        return;
      }
      current = userId;
      if (userId) apply((await Purchases().logIn(userId)).customerInfo);
      else await Purchases().logOut();
    } catch {
      // Sin conexión: RevenueCat reintenta solo y lo guardado en el dispositivo sigue valiendo.
    }
  });
  return queue;
}

/** Vuelve a preguntar a la tienda (al volver la app al frente). */
export async function refreshCustomerInfo() {
  if (!configured || !current) return;
  try {
    apply(await Purchases().getCustomerInfo());
  } catch {
    /* sin conexión */
  }
}

/** Planes de la oferta actual ("default" en RevenueCat), con los precios de la tienda. */
export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configured || !current) return [];
  const offerings = await Purchases().getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/** Prueba gratis de un plan: "2 días". La configuran las tiendas (oferta introductoria), nunca el código. */
export interface FreeTrial {
  count: number;
  unit: string; // DAY | WEEK | MONTH | YEAR
}

/**
 * La prueba gratis que la tienda le ofrece a esta persona en este plan, o null. En Google Play viene en la
 * opción por defecto del plan (Play ya la filtra por elegibilidad); en iOS, en `introPrice` con precio 0.
 */
export function freeTrialOf(pkg: PurchasesPackage): FreeTrial | null {
  const phase = pkg.product.defaultOption?.freePhase;
  if (phase && phase.billingPeriod.value > 0) return { count: phase.billingPeriod.value * Math.max(1, phase.billingCycleCount ?? 1), unit: phase.billingPeriod.unit };
  const intro = pkg.product.introPrice;
  if (intro && intro.price === 0 && intro.periodNumberOfUnits > 0) return { count: intro.periodNumberOfUnits * Math.max(1, intro.cycles), unit: intro.periodUnit };
  return null;
}

/** "2 días", "1 semana" / "2 days", "1 week" */
export function trialText({ count, unit }: FreeTrial, t: T) {
  if (unit === "DAY") return t("plus.trialDay", { count });
  if (unit === "WEEK") return t("plus.trialWeek", { count });
  if (unit === "MONTH") return t("plus.trialMonth", { count });
  if (unit === "YEAR") return t("plus.trialYear", { count });
  return String(count);
}

/**
 * En iOS, quien ya usó una prueba del grupo de suscripciones no la vuelve a tener: se pregunta antes de
 * mostrarla. Devuelve los ids de producto que NO tienen prueba para esta persona (en Android, ninguno).
 */
export async function trialIneligible(packages: PurchasesPackage[]): Promise<Set<string>> {
  if (Platform.OS !== "ios" || !packages.length) return new Set();
  try {
    const ids = packages.map((p) => p.product.identifier);
    const map = await Purchases().checkTrialOrIntroductoryPriceEligibility(ids);
    // 1 = INTRO_ELIGIBILITY_STATUS_INELIGIBLE (sin importar el enum: el módulo nativo puede no estar).
    return new Set(ids.filter((id) => map[id]?.status === 1));
  } catch {
    return new Set();
  }
}

/** La prueba gratis para mostrar fuera de la pantalla de Plus (el plan anual primero), o null. */
export async function bestFreeTrial(): Promise<FreeTrial | null> {
  if (!purchasesAvailable()) return null;
  try {
    const list = await getPackages();
    const sorted = [...list].sort((a, b) => (a.packageType === "ANNUAL" ? -1 : b.packageType === "ANNUAL" ? 1 : 0));
    const ineligible = await trialIneligible(sorted);
    for (const p of sorted) {
      const trial = !ineligible.has(p.product.identifier) && freeTrialOf(p);
      if (trial) return trial;
    }
  } catch {
    /* sin conexión: sin la línea de la prueba */
  }
  return null;
}

export type PurchaseOutcome = { ok: true } | { ok: false; cancelled: boolean; message: string };

const errorText = (e: unknown) => {
  const t = getT();
  const x = e as { userCancelled?: boolean | null; code?: string; message?: string } | null;
  const P = purchasesModule();
  const codes = P?.PURCHASES_ERROR_CODE;
  if (x?.userCancelled || (codes && x?.code === codes.PURCHASE_CANCELLED_ERROR)) return { cancelled: true, message: "" };
  if (codes && x?.code === codes.NETWORK_ERROR) return { cancelled: false, message: t("plus.errNetwork") };
  if (codes && x?.code === codes.PAYMENT_PENDING_ERROR) return { cancelled: false, message: t("plus.errPending") };
  if (codes && x?.code === codes.PURCHASE_NOT_ALLOWED_ERROR) return { cancelled: false, message: t("plus.errNotAllowed") };
  return { cancelled: false, message: t("plus.errPurchase") };
};

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases().purchasePackage(pkg);
    apply(customerInfo);
    return { ok: true };
  } catch (e) {
    return { ok: false, ...errorText(e) };
  }
}

/** Restaurar compras: trae lo comprado con la misma cuenta de la tienda. */
export async function restore(): Promise<{ plus: boolean } | { error: string }> {
  try {
    const info = await Purchases().restorePurchases();
    apply(info);
    return { plus: Boolean(info.entitlements.active[PLUS_ENTITLEMENT]) };
  } catch (e) {
    return { error: errorText(e).message || getT()("plus.errRestore") };
  }
}

/** Gestionar o cancelar la suscripción: la página de la tienda. */
export function openManageSubscription() {
  const fallback = Platform.OS === "ios" ? "https://apps.apple.com/account/subscriptions" : "https://play.google.com/store/account/subscriptions";
  Linking.openURL(usePlusState.getState().managementURL ?? fallback).catch(() => Linking.openURL(fallback).catch(() => {}));
}
