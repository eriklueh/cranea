import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

/**
 * Compras (RevenueCat) y anuncios (AdMob) son módulos nativos: Expo Go no los trae. Ahí, y si un
 * development build viejo no los incluye, quedan apagados sin romper nada: se juega igual, sin
 * comprar ni ver anuncios. Para probarlos hace falta un development build (docs/mobile.md).
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const native = !isExpoGo && (Platform.OS === "ios" || Platform.OS === "android");

type PurchasesModule = typeof import("react-native-purchases");
type AdsModule = typeof import("react-native-google-mobile-ads");

let purchases: PurchasesModule | null | undefined;
let ads: AdsModule | null | undefined;

/** `require` en línea: en Expo Go el módulo ni se evalúa. */
export function purchasesModule(): PurchasesModule | null {
  if (purchases === undefined) {
    try {
      purchases = native ? (require("react-native-purchases") as PurchasesModule) : null;
    } catch {
      purchases = null;
    }
  }
  return purchases;
}

export function adsModule(): AdsModule | null {
  if (ads === undefined) {
    try {
      ads = native ? (require("react-native-google-mobile-ads") as AdsModule) : null;
    } catch {
      ads = null;
    }
  }
  return ads;
}
