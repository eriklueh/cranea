import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { FREE_LEVELS, isFreeLevel, usePlus, usePlusReady } from "@/entitlements";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { CIFRA_HOME, getLevel, isLevelUnlocked, levelKey, nextLevelOf } from "@/games/cifra/data";
import { Loading } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useGameProgress, useProgress } from "@/stores/progress";

export default function CifraLevel() {
  const t = useT();
  const params = useLocalSearchParams<{ mundo: string; nivel: string }>();
  const world = Number(params.mundo);
  const level = Number(params.nivel);
  const puzzle = useMemo(() => getLevel(world, level), [world, level]);
  const progress = useGameProgress("cifra");
  const hydrated = useProgress((s) => s.hydrated);
  const plus = usePlus();
  // Sin Plus, "Siguiente nivel" solo lleva a otro nivel gratis; después, la hoja ofrece Plus.
  const mode = useMemo(() => {
    const next = nextLevelOf(world, level);
    return { kind: "level" as const, world, level, next: next && (plus || isFreeLevel(CIFRA_HOME.worlds, world, next)) ? next : null };
  }, [world, level, plus]);
  const plusReady = usePlusReady();
  const open = isLevelUnlocked(world, level, (w, l) => Boolean(progress.levels[levelKey(w, l)]?.won));
  if (!hydrated || !plusReady) return <Loading label={t("cifra.preparing")} />;
  if (!puzzle) return <NotFound title={t("cifra.levelMissing")} />;
  if (!plus && !isFreeLevel(CIFRA_HOME.worlds, world, level)) {
    return <PlusGate title={t("cifra.plusLevel")} message={t("cifra.plusLevelMessage", { free: FREE_LEVELS })} reason="mundos" />;
  }
  if (!open) return <NotFound title={t("cifra.levelLocked")} message={t("cifra.levelLockedMessage")} />;
  return (
    <>
      <Stack.Screen options={{ title: `Cifra · ${world}-${level}` }} />
      <CifraGame key={puzzle.id} puzzle={puzzle} mode={mode} />
    </>
  );
}
