import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { Loading } from "@/components/ui";
import { FREE_LEVELS, isFreeLevel, usePlus, usePlusReady } from "@/entitlements";
import { NonogramaGame } from "@/games/nonograma/components/nonograma-game";
import { NONOGRAMA_HOME, getLevel, isLevelUnlocked, levelKey, nextLevelOf } from "@/games/nonograma/data";
import { useT } from "@/lib/i18n";
import { useGameProgress, useProgress } from "@/stores/progress";

export default function NonogramaLevel() {
  const t = useT();
  const params = useLocalSearchParams<{ mundo: string; nivel: string }>();
  const world = Number(params.mundo);
  const level = Number(params.nivel);
  const puzzle = useMemo(() => getLevel(world, level), [world, level]);
  const progress = useGameProgress("nonograma");
  const hydrated = useProgress((s) => s.hydrated);
  const plus = usePlus();
  // Sin Plus, "Siguiente nivel" solo lleva a otro nivel gratis; después, la hoja ofrece Plus.
  const mode = useMemo(() => {
    const next = nextLevelOf(world, level);
    return { kind: "level" as const, world, level, next: next && (plus || isFreeLevel(NONOGRAMA_HOME.worlds, next.world, next.level)) ? next : null };
  }, [world, level, plus]);
  const plusReady = usePlusReady();
  const open = isLevelUnlocked(world, level, (w, l) => Boolean(progress.levels[levelKey(w, l)]?.won));
  if (!hydrated || !plusReady) return <Loading label={t("nonograma.preparing")} />;
  if (!puzzle) return <NotFound title={t("nonograma.levelMissing")} />;
  if (!plus && !isFreeLevel(NONOGRAMA_HOME.worlds, world, level)) {
    return <PlusGate title={t("nonograma.plusLevel")} message={t("nonograma.plusLevelMessage", { free: FREE_LEVELS })} reason="mundos" />;
  }
  if (!open) return <NotFound title={t("nonograma.levelLocked")} message={t("nonograma.levelLockedMessage")} />;
  return (
    <>
      <Stack.Screen options={{ title: `Nonograma · ${world}-${level}` }} />
      <NonogramaGame key={puzzle.id} puzzle={puzzle} mode={mode} />
    </>
  );
}
