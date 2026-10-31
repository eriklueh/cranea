import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Vibración corta para los momentos que importan; las mismas tres que la web. */
export function haptic(kind: "tap" | "invalid" | "win") {
  if (Platform.OS === "web") return;
  const run =
    kind === "tap"
      ? Haptics.selectionAsync()
      : kind === "invalid"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  run.catch(() => {});
}
