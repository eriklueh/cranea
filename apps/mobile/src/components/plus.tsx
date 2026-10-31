import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Button, Card, Icon, Row, Screen, Text } from "@/components/ui";
import { showRewarded } from "@/monetization/ads";
import { useTheme } from "@/theme/theme";
import { fonts } from "@/theme/tokens";

/** Por qué se abre la pantalla de Plus: cambia el título, nada más. */
export type PlusReason = "mundos" | "archivo" | "pistas" | "anuncios";

export function usePlusPaywall() {
  const router = useRouter();
  return useCallback((motivo?: PlusReason) => router.push({ pathname: "/plus", params: motivo ? { motivo } : {} }), [router]);
}

/** Etiqueta "Plus" junto a lo que requiere la suscripción. */
export function PlusBadge({ small }: { small?: boolean }) {
  const { colors } = useTheme();
  return (
    <Row gap={3} style={{ backgroundColor: colors.cluePresentBg, borderRadius: 999, paddingHorizontal: small ? 5 : 8, paddingVertical: small ? 0 : 2 }} accessibilityLabel="Craneá Plus">
      <Icon name="star" size={small ? 9 : 12} color={colors.cluePresent} />
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: small ? 10 : 12, color: colors.cluePresent }}>Plus</Text>
    </Row>
  );
}

/** Pantalla en lugar de algo que es de Plus (un nivel de un mundo pago, el archivo). */
export function PlusGate({ title, message, reason }: { title: string; message: string; reason: PlusReason }) {
  const { colors } = useTheme();
  const router = useRouter();
  const open = usePlusPaywall();
  return (
    <Screen contentStyle={{ paddingTop: 32 }}>
      <Card raised style={{ gap: 12, alignItems: "flex-start" }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.muted }}>
          <Icon name="lock-closed" size={22} />
        </View>
        <Row gap={8}>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          <PlusBadge />
        </Row>
        <Text variant="muted">{message}</Text>
        <Button title="Conocer Craneá Plus" icon="star" size="lg" style={{ alignSelf: "stretch" }} onPress={() => open(reason)} />
        <Button title="Volver" variant="ghost" style={{ alignSelf: "stretch" }} onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))} />
      </Card>
    </Screen>
  );
}

export type RewardState = "idle" | "loading" | "unavailable";

/** Ver un anuncio con recompensa: `run()` devuelve true si se ganó la recompensa. */
export function useRewardedAd() {
  const [state, setState] = useState<RewardState>("idle");
  const run = useCallback(async () => {
    setState("loading");
    const outcome = await showRewarded();
    setState(outcome === "unavailable" ? "unavailable" : "idle");
    return outcome === "earned";
  }, []);
  return { state, run };
}
