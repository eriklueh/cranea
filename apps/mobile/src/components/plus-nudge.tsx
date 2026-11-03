import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayKey } from "@cranea/core";
import { WORLDS as CIFRA_WORLDS } from "@cranea/core/cifra";
import { WORLDS as NONOGRAMA_WORLDS } from "@cranea/core/nonograma";
import { PALABRA_WORLDS } from "@cranea/core/palabra";
import { WORLDS as PUENTES_WORLDS } from "@cranea/core/puentes";
import { WORLDS as TORRES_WORLDS } from "@cranea/core/torres";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { usePlusPaywall } from "@/components/plus";
import { Button, Icon, Row, Text } from "@/components/ui";
import { plusLevelCount, usePlus, usePlusReady } from "@/entitlements";
import { gameById } from "@/games/registry";
import { bestFreeTrial, trialText, type FreeTrial } from "@/monetization/purchases";
import { useTheme } from "@/theme/theme";
import { radius } from "@/theme/tokens";

/** Niveles de Plus de cada juego, de los mismos datos que los mapas. */
const PLUS_LEVELS: Record<string, number> = {
  cifra: plusLevelCount(CIFRA_WORLDS),
  nonograma: plusLevelCount(NONOGRAMA_WORLDS),
  palabra: plusLevelCount(PALABRA_WORLDS),
  puentes: plusLevelCount(PUENTES_WORLDS),
  torres: plusLevelCount(TORRES_WORLDS),
};

/**
 * Cuándo se mostró la tarjeta de cada juego. Se muestra a lo sumo una vez por día y por juego: el mismo
 * momento (el diario de hoy, en su hoja y en la pantalla de "ya jugado") la puede volver a mostrar, otro
 * no. Cerrarla la saca por el resto del día.
 */
interface Seen {
  date: string;
  /** Dónde apareció: "daily:2026-11-01", "level:1-2". */
  slot: string;
  dismissed: boolean;
}
const useNudges = create<{ seen: Record<string, Seen>; hydrated: boolean }>()(
  persist((): { seen: Record<string, Seen>; hydrated: boolean } => ({ seen: {}, hydrated: false }), {
    name: "cranea-plus-nudge",
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
    partialize: ({ seen }) => ({ seen }),
    onRehydrateStorage: () => () => useNudges.setState({ hydrated: true }),
  }),
);

export type NudgeMode = { kind: "level"; world: number; level: number } | { kind: "daily"; date: string; practice?: boolean };

/**
 * "¿Querés seguir?": al terminar el diario o un nivel gratis, una tarjeta chica que ofrece Plus (y la
 * prueba gratis, si la tienda la tiene para esta persona). Nunca con Plus, nunca en una práctica, y va
 * debajo de las acciones: no le quita lugar a "Siguiente nivel" ni al ranking.
 * `onLeave` cierra la hoja antes de abrir Plus (un Modal quedaría encima de la pantalla nueva).
 */
export function PlusNudge({ gameId, mode, won = true, onLeave }: { gameId: string; mode: NudgeMode | { kind: string }; won?: boolean; onLeave?: () => void }) {
  const plus = usePlus();
  const plusReady = usePlusReady();
  const hydrated = useNudges((s) => s.hydrated);
  const record = useNudges((s) => s.seen[gameId]);
  const levels = PLUS_LEVELS[gameId] ?? 0;
  const today = todayKey();
  const slot = mode.kind === "level" && "world" in mode ? `level:${mode.world}-${mode.level}` : mode.kind === "daily" && "date" in mode && !mode.practice ? `daily:${mode.date}` : null;
  const eligible = Boolean(slot) && won && plusReady && !plus && hydrated && levels > 0 && (record?.date !== today || (record.slot === slot && !record.dismissed));

  useEffect(() => {
    if (!eligible || !slot) return;
    const r = useNudges.getState().seen[gameId];
    if (r?.date === today && r.slot === slot) return;
    useNudges.setState((s) => ({ seen: { ...s.seen, [gameId]: { date: today, slot, dismissed: false } } }));
  }, [eligible, gameId, slot, today]);

  if (!eligible || !slot) return null;
  const dismiss = () => useNudges.setState((s) => ({ seen: { ...s.seen, [gameId]: { date: today, slot, dismissed: true } } }));
  return <NudgeCard game={gameById(gameId)?.name ?? "este juego"} levels={levels} onDismiss={dismiss} onLeave={onLeave} />;
}

function NudgeCard({ game, levels, onDismiss, onLeave }: { game: string; levels: number; onDismiss: () => void; onLeave?: () => void }) {
  const { colors } = useTheme();
  const paywall = usePlusPaywall();
  const [trial, setTrial] = useState<FreeTrial | null>(null);
  useEffect(() => {
    let alive = true;
    bestFreeTrial().then((t) => alive && setTrial(t));
    return () => {
      alive = false;
    };
  }, []);
  const open = () => {
    onLeave?.();
    paywall("mundos");
  };

  return (
    <Animated.View entering={motion.appear()} style={{ borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cluePresentBg, padding: 12, gap: 10 }}>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.card }}>
          <Icon name="star" size={16} color={colors.cluePresent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">¿Querés seguir?</Text>
          <Text variant="small">Tenés {levels} niveles más de {game} con Craneá Plus.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ahora no" onPress={onDismiss} hitSlop={10} style={{ minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" }}>
          <Icon name="close" size={18} color={colors.mutedForeground} />
        </Pressable>
      </Row>
      <Button title={trial ? `Probá gratis ${trialText(trial)}` : "Ver Craneá Plus"} icon="star" variant="outline" onPress={open} />
    </Animated.View>
  );
}
