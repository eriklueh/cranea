"use client";
import Link from "next/link";
import { useMemo } from "react";
import { todayKey } from "@cranea/core";
import { generateDaily } from "@cranea/core/torres";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatTime } from "@/lib/utils";
import { useGameProgress } from "@/stores/progress";
import { TorresGame } from "@/games/torres/components/torres-game";
import { dailyNumber, GAME_ID } from "@/games/torres/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Se juega una vez. */
export function DailyGame() {
  const hydrated = useHydrated();
  const date = hydrated ? todayKey() : null;
  const progress = useGameProgress(GAME_ID);
  // Se fija al entrar: si la partida termina acá, el juego sigue en pantalla para ver el resultado.
  const playedOnArrival = useMemo(() => (date ? progress.daily[date] : undefined), [date]);
  const puzzle = useMemo(() => (date && !playedOnArrival ? generateDaily(date) : null), [date, playedOnArrival]);
  const mode = useMemo(() => (date ? { kind: "daily" as const, date, number: dailyNumber(date) } : null), [date]);

  if (!date || !mode) return <main className="mx-auto max-w-md px-4 text-muted-foreground sm:pl-16">Preparando la ciudad…</main>;
  if (playedOnArrival) {
    return (
      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4 pb-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Torres del día #{mode.number}</h1>
        <p className="text-muted-foreground">
          {playedOnArrival.won
            ? `Ya la resolviste: ${playedOnArrival.attempts} ${playedOnArrival.attempts === 1 ? "intento" : "intentos"}, ${formatTime(playedOnArrival.timeMs)}.`
            : "Hoy ya la jugaste."}{" "}
          Mañana hay otra.
        </p>
        <Button asChild size="lg">
          <Link href="/torres">Volver a los mundos</Link>
        </Button>
      </main>
    );
  }
  if (!puzzle) return null;
  return <TorresGame puzzle={puzzle} mode={mode} />;
}
