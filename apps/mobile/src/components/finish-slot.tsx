import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { Text } from "@/components/ui";
import { useTheme } from "@/theme/theme";

/**
 * Lugar de los controles que, al terminar la partida, muestra "Ver resultado" en el mismo espacio.
 * Los controles quedan montados pero invisibles (sin toques ni lector de pantalla), así la pantalla
 * no cambia de alto: antes se reemplazaban por un enlace chico y todo saltaba hacia abajo.
 */
export function FinishSlot({ finished, done, children, style }: { finished: boolean; done: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <View
        style={finished ? styles.hidden : undefined}
        pointerEvents={finished ? "none" : "auto"}
        importantForAccessibility={finished ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={finished}
      >
        {children}
      </View>
      {finished && (
        <Animated.View entering={motion.appear()} style={styles.done}>
          {done}
        </Animated.View>
      )}
    </View>
  );
}

/** El enlace "Ver resultado" que vuelve a abrir la hoja. */
export function ResultLink({ label = "Ver resultado", onPress }: { label?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ minHeight: 48, alignSelf: "center", justifyContent: "center", paddingHorizontal: 12 }}>
      <Text variant="bodyBold" style={{ textDecorationLine: "underline", textDecorationColor: colors.margin }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  done: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center" },
});
