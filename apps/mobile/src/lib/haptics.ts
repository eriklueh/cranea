import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { getPrefs } from "@/lib/prefs";
import { sound } from "@/lib/sound";

/**
 * Respuesta para los momentos que importan. La vibración sigue «Vibración» de Ajustes; completar una
 * línea, ganar y equivocarse además suenan (si «Sonido» está prendido), como en la web.
 */
export function haptic(kind: "tap" | "line" | "invalid" | "win") {
  if (kind === "line") sound("line");
  if (kind === "invalid") sound("error");
  if (kind === "win") sound("win");
  if (Platform.OS === "web" || !getPrefs().vibration) return;
  const run =
    kind === "tap"
      ? Haptics.selectionAsync()
      : kind === "line"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : kind === "invalid"
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  run.catch(() => {});
}
