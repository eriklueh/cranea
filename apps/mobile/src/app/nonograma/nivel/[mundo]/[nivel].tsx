import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { Loading } from "@/components/ui";
import { isFreeWorld, usePlus, usePlusReady } from "@/entitlements";
import { NonogramaGame } from "@/games/nonograma/components/nonograma-game";
import { NONOGRAMA_HOME, getLevel, isLevelUnlocked, levelKey, nextLevelOf } from "@/games/nonograma/data";
import { useGameProgress, useProgress } from "@/stores/progress";

export default function NonogramaLevel() {
  const params = useLocalSearchParams<{ mundo: string; nivel: string }>();
  const world = Number(params.mundo);
  const level = Number(params.nivel);
  const puzzle = useMemo(() => getLevel(world, level), [world, level]);
  const progress = useGameProgress("nonograma");
  const mode = useMemo(() => ({ kind: "level" as const, world, level, next: nextLevelOf(world, level) }), [world, level]);
  const hydrated = useProgress((s) => s.hydrated);
  const plus = usePlus();
  const plusReady = usePlusReady();
  const open = isLevelUnlocked(world, level, (w, l) => Boolean(progress.levels[levelKey(w, l)]?.won));
  if (!hydrated || !plusReady) return <Loading label="Preparando el tablero…" />;
  if (!puzzle) return <NotFound title="Nivel inexistente" />;
  if (!plus && !isFreeWorld(NONOGRAMA_HOME.worlds, world)) {
    return <PlusGate title="Nivel de Craneá Plus" message="Este mundo se abre con Craneá Plus, junto con todos los niveles de Nonograma y de los demás juegos." reason="mundos" />;
  }
  if (!open) return <NotFound title="Nivel bloqueado" message="Ganá el nivel anterior para abrirlo." />;
  return (
    <>
      <Stack.Screen options={{ title: `Nonograma · ${world}-${level}` }} />
      <NonogramaGame key={puzzle.id} puzzle={puzzle} mode={mode} />
    </>
  );
}
