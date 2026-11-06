import { Platform } from "react-native";
import { isExpoGo } from "@/monetization/native";

/**
 * react-native-android-widget carga su módulo nativo al importarse (y en Expo Go no existe), así que
 * se pide con `require` en línea: en iOS, la web y Expo Go ni se evalúa. Ver src/monetization/native.ts.
 */
export type WidgetModule = typeof import("react-native-android-widget");
let mod: WidgetModule | null | undefined;

export function widgetModule(): WidgetModule | null {
  if (mod === undefined) {
    try {
      mod = Platform.OS === "android" && !isExpoGo ? (require("react-native-android-widget") as WidgetModule) : null;
    } catch {
      mod = null;
    }
  }
  return mod;
}
