import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { getLevel, isLevelUnlocked, levelKey, nextLevelOf } from "@/games/cifra/data";
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
  const open = isLevelUnlocked(world, level, (w, l) => Boolean(progress.levels[levelKey(w, l)]?.won));
  if (!hydrated) return <Loading label="Preparando el tablero…" />;
  if (!puzzle) return <NotFound title="Nivel inexistente" />;
  if (!open) return <NotFound title="Nivel bloqueado" message="Ganá el nivel anterior para abrirlo." />;
  return (
    <>
      <Stack.Screen options={{ title: `Cifra · ${world}-${level}` }} />
      <CifraGame key={puzzle.id} puzzle={puzzle} mode={mode} />
    </>
  );
}
