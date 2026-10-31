"use client";
import { useMemo } from "react";
import { todayKey } from "@cranea/core";
import { generateDaily } from "@cranea/core/puentes";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProgress } from "@/stores/progress";
import { PuentesGame } from "@/games/puentes/components/puentes-game";
import { dailyNumber, GAME_ID } from "@/games/puentes/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Se juega una vez por día. */
export function DailyGame() {
  const hydrated = useHydrated();
  const date = hydrated ? todayKey() : null;
  const puzzle = useMemo(() => (date ? generateDaily(date) : null), [date]);
  const mode = useMemo(() => (date ? { kind: "daily" as const, date, number: dailyNumber(date) } : null), [date]);
  // Se lee una sola vez al abrir: ganar ahora no debe cambiar la partida en curso a modo revisión.
  const alreadyPlayed = useMemo(() => (date ? Boolean(useProgress.getState().games[GAME_ID]?.daily[date]) : false), [date]);
  if (!puzzle || !mode) return <main className="mx-auto max-w-md px-4 text-muted-foreground sm:pl-16">Preparando el mapa…</main>;
  return <PuentesGame puzzle={puzzle} mode={mode} alreadyPlayed={alreadyPlayed} />;
}
