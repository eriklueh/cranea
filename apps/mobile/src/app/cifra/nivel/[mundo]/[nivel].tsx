import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { isFreeWorld, usePlus, usePlusReady } from "@/entitlements";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { CIFRA_HOME, getLevel, isLevelUnlocked, levelKey, nextLevelOf } from "@/games/cifra/data";
import { Loading } from "@/components/ui";
import { useGameProgress, useProgress } from "@/stores/progress";

export default function CifraLevel() {
  const params = useLocalSearchParams<{ mundo: string; nivel: string }>();
  const world = Number(params.mundo);
  const level = Number(params.nivel);
  const puzzle = useMemo(() => getLevel(world, level), [world, level]);
  const progress = useGameProgress("cifra");
  const mode = useMemo(() => ({ kind: "level" as const, world, level, next: nextLevelOf(world, level) }), [world, level]);
  const hydrated = useProgress((s) => s.hydrated);
  const plus = usePlus();
  const plusReady = usePlusReady();
  const open = isLevelUnlocked(world, level, (w, l) => Boolean(progress.levels[levelKey(w, l)]?.won));
  if (!hydrated || !plusReady) return <Loading label="Preparando el tablero…" />;
  if (!puzzle) return <NotFound title="Nivel inexistente" />;
  if (!plus && !isFreeWorld(CIFRA_HOME.worlds, world)) {
    return <PlusGate title="Nivel de Craneá Plus" message="Este mundo se abre con Craneá Plus, junto con todos los niveles de Cifra y de los demás juegos." reason="mundos" />;
  }
  if (!open) return <NotFound title="Nivel bloqueado" message="Ganá el nivel anterior para abrirlo." />;
  return (
    <>
      <Stack.Screen options={{ title: `Cifra · ${world}-${level}` }} />
      <CifraGame key={puzzle.id} puzzle={puzzle} mode={mode} />
    </>
  );
}
