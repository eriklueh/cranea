import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { Loading } from "@/components/ui";
import { FREE_LEVELS, isFreeLevel, usePlus, usePlusReady } from "@/entitlements";
import { PuentesGame } from "@/games/puentes/components/puentes-game";
import { PUENTES_HOME, getLevel, isLevelUnlocked, levelKey, nextLevelOf } from "@/games/puentes/data";
import { useT } from "@/lib/i18n";
import { useGameProgress, useProgress } from "@/stores/progress";

export default function PuentesLevel() {
  const t = useT();
  const params = useLocalSearchParams<{ mundo: string; nivel: string }>();
  const world = Number(params.mundo);
  const level = Number(params.nivel);
  const puzzle = useMemo(() => getLevel(world, level), [world, level]);
  const progress = useGameProgress("puentes");
  const hydrated = useProgress((s) => s.hydrated);
  const plus = usePlus();
  // Sin Plus, "Siguiente nivel" solo lleva a otro nivel gratis; después, la hoja ofrece Plus.
  const mode = useMemo(() => {
    const next = nextLevelOf(world, level);
    return { kind: "level" as const, world, level, next: next && (plus || isFreeLevel(PUENTES_HOME.worlds, world, next)) ? next : null };
  }, [world, level, plus]);
  const plusReady = usePlusReady();
  const open = isLevelUnlocked(world, level, (w, l) => Boolean(progress.levels[levelKey(w, l)]?.won));
  if (!hydrated || !plusReady) return <Loading label={t("puentes.preparing")} />;
  if (!puzzle) return <NotFound title={t("puentes.levelMissing")} />;
  if (!plus && !isFreeLevel(PUENTES_HOME.worlds, world, level)) {
    return <PlusGate title={t("puentes.plusLevel")} message={t("puentes.plusLevelMessage", { free: FREE_LEVELS })} reason="mundos" />;
  }
  if (!open) return <NotFound title={t("puentes.levelLocked")} message={t("puentes.levelLockedMessage")} />;
  return (
    <>
      <Stack.Screen options={{ title: `Puentes · ${world}-${level}` }} />
      <PuentesGame key={puzzle.id} puzzle={puzzle} mode={mode} />
    </>
  );
}
