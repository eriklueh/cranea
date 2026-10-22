"use client";
import { useMemo } from "react";
import { todayKey } from "@cranea/core";
import { generateDaily } from "@cranea/core/cifra";
import { useHydrated } from "@/hooks/use-hydrated";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { dailyNumber } from "@/games/cifra/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. */
export function DailyGame() {
  const hydrated = useHydrated();
  const date = hydrated ? todayKey() : null;
  const puzzle = useMemo(() => (date ? generateDaily(date) : null), [date]);
  const mode = useMemo(() => (date ? { kind: "daily" as const, date, number: dailyNumber(date) } : null), [date]);
  if (!puzzle || !mode) return <main className="mx-auto max-w-md px-4 text-muted-foreground sm:pl-16">Preparando el tablero…</main>;
  return <CifraGame puzzle={puzzle} mode={mode} />;
}
