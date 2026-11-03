import { useRef, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui";
import { motion } from "@/lib/motion";
import { useTheme } from "@/theme/theme";
import { alpha, radius } from "@/theme/tokens";

/** `sheet`: la hoja sube en `slow` sin pasarse; el fondo, `fade`. Con movimiento reducido aparecen sin animación. */
const SHEET_IN = motion.sheetIn();
const BACKDROP_IN = motion.fade();

/**
 * Margen inferior estable mientras la hoja está abierta. Dentro de un Modal translúcido de Android
 * los insets llegan en 0 el primer cuadro y después se actualizan: la hoja subía y enseguida se
 * corría hacia abajo. Se toma el mayor entre el contexto y las medidas iniciales de la ventana y
 * no se cambia hasta cerrarla.
 */
function useStableBottomInset(visible: boolean) {
  const insets = useSafeAreaInsets();
  const frozen = useRef<number | null>(null);
  const current = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  if (!visible) frozen.current = null;
  else if (frozen.current === null) frozen.current = current;
  return frozen.current ?? current;
}

/** Hoja de resultado que sube desde abajo (el diálogo de resultado de la web). */
export function ResultSheet({ visible, onClose, title, description, children }: { visible: boolean; onClose: () => void; title: string; description: string; children: ReactNode }) {
  const { colors } = useTheme();
  const bottom = useStableBottomInset(visible);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {visible && (
        <Animated.View entering={BACKDROP_IN} style={[StyleSheet.absoluteFill, { backgroundColor: alpha("#000000", 0.45) }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar" accessibilityRole="button" />
        </Animated.View>
      )}
      {visible && (
        <Animated.View
          entering={SHEET_IN}
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.ink, paddingBottom: bottom + 16 }]}
          accessibilityViewIsModal
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ScrollView contentContainerStyle={{ gap: 14 }} bounces={false}>
            <View style={{ gap: 4 }}>
              <Text variant="title" accessibilityRole="header">{title}</Text>
              <Text variant="muted">{description}</Text>
            </View>
            {children}
          </ScrollView>
        </Animated.View>
      )}
    </Modal>
  );
}

/** Compartir el resultado con la hoja nativa del sistema. */
export async function shareText(message: string) {
  try {
    await Share.share({ message });
  } catch {
    /* la persona canceló */
  }
}

const styles = StyleSheet.create({
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "88%", borderTopLeftRadius: radius.xl * 1.5, borderTopRightRadius: radius.xl * 1.5, borderWidth: 2, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
});
