import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { usePlusPaywall, useRewardedAd } from "@/components/plus";
import { Button, Card, Icon, Text } from "@/components/ui";
import { usePlus } from "@/entitlements";
import { adsAvailable } from "@/monetization/ads";
import { useExtraAttempts } from "@/monetization/extra-attempt";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

/**
 * Los dos únicos lugares con anuncios, siempre elegidos por la persona y nunca con Plus:
 * una pista más cuando no quedan y un intento más en un diario perdido.
 */

const UNAVAILABLE = "No hay anuncios disponibles ahora. Probá más tarde.";

function PlusLink({ text, reason }: { text: string; reason: "pistas" | "anuncios" }) {
  const paywall = usePlusPaywall();
  return (
    <Pressable onPress={() => paywall(reason)} accessibilityRole="link" hitSlop={6} style={{ minHeight: 44, justifyContent: "center" }}>
      <Text variant="bodyBold" style={{ fontSize: 14, textDecorationLine: "underline" }}>{text}</Text>
    </Pressable>
  );
}

/** No quedan pistas gratis en este tablero: un anuncio da una más, o Plus las da sin límite. */
export function HintOffer({ onEarned, onClose }: { onEarned: () => void; onClose: () => void }) {
  const { colors } = useTheme();
  const { state, run } = useRewardedAd();
  const ads = adsAvailable();
  return (
    <Animated.View entering={motion.appear()} style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLiveRegion="polite">
      <Icon name="bulb-outline" size={18} color={colors.cluePresent} />
      <View style={{ flex: 1, gap: 8 }}>
        <Text>Ya usaste la pista gratis de este tablero.</Text>
        {ads && (
          <Button
            title="Ver un anuncio para una pista"
            icon="play-circle-outline"
            variant="outline"
            loading={state === "loading"}
            onPress={async () => {
              if (await run()) onEarned();
            }}
          />
        )}
        {state === "unavailable" && <Text variant="small">{UNAVAILABLE}</Text>}
        <PlusLink text="Pistas sin límite con Craneá Plus" reason="pistas" />
      </View>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={10}>
        <Icon name="close" size={18} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

/** Si en este diario perdido se puede ofrecer un intento más (una vez por diario; con Plus, sin anuncio). */
export function useExtraAttemptOffer(gameId: string, date: string | null) {
  const plus = usePlus();
  const used = useExtraAttempts((s) => (date ? Boolean(s.used[`${gameId}:${date}`]) : true));
  return { available: Boolean(date) && !used && (plus || adsAvailable()), plus };
}

/**
 * En la hoja de resultado de un diario perdido. La solución queda tapada hasta que la persona
 * elige: ver la solución (y renunciar al intento) o jugar un intento más.
 */
export function ExtraAttemptOffer({ gameId, date, onGranted, onReveal }: { gameId: string; date: string; onGranted: () => void; onReveal: () => void }) {
  const { colors } = useTheme();
  const { plus } = useExtraAttemptOffer(gameId, date);
  const { state, run } = useRewardedAd();
  const markUsed = useExtraAttempts((s) => s.markUsed);
  const grant = () => {
    markUsed(gameId, date);
    onGranted();
  };
  return (
    <Card style={{ gap: 10, borderColor: colors.ink }}>
      <Text variant="bodyBold" style={{ fontFamily: fonts.displayHeavy, fontSize: 18 }}>¿Un intento más?</Text>
      <Text variant="small">Si sale, suma a tu racha y a tus estadísticas. En el ranking este diario queda como no resuelto.</Text>
      {plus ? (
        <Button title="Usar un intento más" icon="add-circle-outline" size="lg" onPress={grant} />
      ) : (
        <Button
          title="Ver un anuncio: un intento más"
          icon="play-circle-outline"
          size="lg"
          loading={state === "loading"}
          onPress={async () => {
            if (await run()) grant();
          }}
        />
      )}
      {state === "unavailable" && <Text variant="small" accessibilityLiveRegion="polite">{UNAVAILABLE}</Text>}
      {!plus && state === "unavailable" && <PlusLink text="Con Craneá Plus, sin anuncios" reason="anuncios" />}
      <Button
        title="Ver la solución"
        variant="ghost"
        disabled={state === "loading"}
        onPress={() => {
          markUsed(gameId, date);
          onReveal();
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: radius.xl, padding: 12 },
});
