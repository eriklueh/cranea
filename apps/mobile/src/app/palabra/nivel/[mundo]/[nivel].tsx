import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { FREE_LEVELS, isFreeLevel, usePlus, usePlusReady } from "@/entitlements";
import { PalabraGame } from "@/games/palabra/components/palabra-game";
import { PALABRA_HOME, getLevel, isLevelUnlocked, levelKey, nextLevelOf } from "@/games/palabra/data";
import { Loading } from "@/components/ui";
import { useGameProgress, useProgress } from "@/stores/progress";

export default function PalabraLevel() {
  const params = useLocalSearchParams<{ mundo: string; nivel: string }>();
  const world = Number(params.mundo);
  const level = Number(params.nivel);
  const puzzle = useMemo(() => getLevel(world, level), [world, level]);
  const progress = useGameProgress("palabra");
  const hydrated = useProgress((s) => s.hydrated);
  const plus = usePlus();
  // Sin Plus, "Siguiente nivel" solo lleva a otro nivel gratis; después, la hoja ofrece Plus.
  const mode = useMemo(() => {
    const next = nextLevelOf(world, level);
    return { kind: "level" as const, world, level, next: next && (plus || isFreeLevel(PALABRA_HOME.worlds, world, next)) ? next : null };
  }, [world, level, plus]);
  const plusReady = usePlusReady();
  const open = isLevelUnlocked(world, level, (w, l) => Boolean(progress.levels[levelKey(w, l)]?.won));
  if (!hydrated || !plusReady) return <Loading label="Preparando el tablero…" />;
  if (!puzzle) return <NotFound title="Nivel inexistente" />;
  if (!plus && !isFreeLevel(PALABRA_HOME.worlds, world, level)) {
    return <PlusGate title="Nivel de Craneá Plus" message={`Los primeros ${FREE_LEVELS} niveles de Palabra son gratis. Este y todos los demás se abren con Craneá Plus, junto con los de los otros juegos.`} reason="mundos" />;
  }
  if (!open) return <NotFound title="Nivel bloqueado" message="Ganá el nivel anterior para abrirlo." />;
  return (
    <>
      <Stack.Screen options={{ title: `Palabra · ${world}-${level}` }} />
      <PalabraGame key={puzzle.id} puzzle={puzzle} mode={mode} />
    </>
  );
}
