import { hintFor, type LineKind } from "@cranea/core/nonograma";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { HintOffer } from "@/components/rewards";
import { Button, Icon, Row, Text } from "@/components/ui";
import { FREE_HINTS, usePlus } from "@/entitlements";
import { motion } from "@/lib/motion";
import { useTheme } from "@/theme/theme";
import { radius } from "@/theme/tokens";
import { HINT_COPY, hintExplain, hintNudge, techniqueName } from "../hint-copy";
import { useLocale } from "@/lib/i18n";
import { useNonograma } from "../store";

/**
 * Pistas como en Cifra (apps/web/src/games/nonograma/components/hint.tsx): primer toque, qué línea
 * mirar; segundo, la deducción. Nunca pinta ni cruza. Sin Plus, `FREE_HINTS` por tablero; después,
 * un anuncio da una más o Plus las da sin límite.
 */

const ask = (plus: boolean) => {
  const s = useNonograma.getState();
  if (!s.puzzle || s.stroke) return;
  s.askHint(hintFor(s.puzzle, s.board), plus ? null : FREE_HINTS);
};

/** El botón, discreto y centrado como en Cifra. Al terminar queda invisible en su lugar. */
export function HintTools() {
  useLocale(); // redibuja al cambiar de idioma
  const status = useNonograma((s) => s.status);
  const level = useNonograma((s) => s.hint?.level);
  const plus = usePlus();
  const playing = status === "playing";
  return (
    <Row style={[{ justifyContent: "center" }, !playing && { opacity: 0 }]} pointerEvents={playing ? "auto" : "none"} importantForAccessibility={playing ? "auto" : "no-hide-descendants"}>
      <Button title={HINT_COPY.button} icon="bulb-outline" variant="ghost" onPress={() => ask(plus)} accessibilityLabel={level === 1 ? HINT_COPY.explain : HINT_COPY.ask} />
    </Row>
  );
}

/** Fila o columna que señala la pista abierta (null si no hay). */
export const hintLineOf = (s: ReturnType<typeof useNonograma.getState>): { line: LineKind; index: number } | null => {
  const info = s.status === "playing" ? s.hint?.info : undefined;
  if (!info || info.kind === "done") return null;
  return info.kind === "mistake" ? info : info.step;
};

export function HintPanel() {
  useLocale(); // redibuja al cambiar de idioma
  const { colors } = useTheme();
  const hint = useNonograma((s) => s.hint);
  const status = useNonograma((s) => s.status);
  const outOfHints = useNonograma((s) => s.outOfHints);
  const closeHint = useNonograma((s) => s.closeHint);
  const plus = usePlus();
  const playing = status === "playing";
  if (outOfHints && playing) {
    return (
      <HintOffer
        onClose={closeHint}
        onEarned={() => {
          useNonograma.getState().grantHint();
          ask(plus);
        }}
      />
    );
  }
  // Al terminar, la pista abierta se queda (sin acciones): si desapareciera, lo de abajo saltaría.
  if (!hint) return null;
  const { info, level } = hint;
  return (
    <Animated.View entering={motion.appear()} style={[styles.hint, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLiveRegion="polite">
      <Icon name="bulb" size={18} color={colors.cluePresent} />
      <View style={{ flex: 1, gap: 6 }}>
        {level === 1 || info.kind === "done" ? (
          <>
            <Text>{hintNudge(info)}</Text>
            {info.kind !== "done" && playing && (
              // La misma pista (ya contada): la deducción, aunque el tablero haya cambiado desde entonces.
              <Pressable onPress={() => useNonograma.getState().askHint(info, plus ? null : FREE_HINTS)} accessibilityRole="button" hitSlop={8}>
                <Text variant="bodyBold" style={{ textDecorationLine: "underline" }}>{HINT_COPY.why}</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Animated.View key="explain" entering={motion.fade()} style={{ gap: 4 }}>
            {info.kind === "step" && <Text variant="small" style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>{techniqueName(info.step)}</Text>}
            <Text>{hintExplain(info)}</Text>
          </Animated.View>
        )}
      </View>
      <Pressable onPress={closeHint} accessibilityRole="button" accessibilityLabel={HINT_COPY.close} hitSlop={10}>
        <Icon name="close" size={18} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: radius.xl, padding: 12, marginHorizontal: 8 },
});
