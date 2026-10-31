"use client";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useMemo } from "react";
import { todayKey } from "@cranea/core";
import { generateDaily } from "@cranea/core/nonograma";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatTime } from "@/lib/utils";
import { useProgress } from "@/stores/progress";
import { NonogramaGame } from "@/games/nonograma/components/nonograma-game";
import { PixelArt, solutionRows } from "@/games/nonograma/components/pixel-art";
import { dailyNumber, GAME_ID } from "@/games/nonograma/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Se juega una vez. */
export function DailyGame() {
  const hydrated = useHydrated();
  const date = hydrated ? todayKey() : null;
  const puzzle = useMemo(() => (date ? generateDaily(date) : null), [date]);
  const mode = useMemo(() => (date ? { kind: "daily" as const, date, number: dailyNumber(date) } : null), [date]);
  // Se mira al entrar: si se termina ahora, la partida sigue en pantalla con su resultado.
  const playedBefore = useMemo(() => (date ? useProgress.getState().games[GAME_ID]?.daily[date] : undefined), [date]);

  if (!puzzle || !mode) return <main className="mx-auto max-w-md px-4 text-muted-foreground sm:pl-16">Preparando el tablero…</main>;
  if (!playedBefore) return <NonogramaGame puzzle={puzzle} mode={mode} />;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10">
      <Link href="/nonograma" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeftIcon className="size-4" /> Nonograma
      </Link>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Nonograma del día #{mode.number}</h1>
      <p className="mt-2 text-muted-foreground">
        {playedBefore.won
          ? `Ya lo resolviste: ${playedBefore.attempts} ${playedBefore.attempts === 1 ? "intento" : "intentos"}, ${formatTime(playedBefore.timeMs)}.`
          : "Hoy no salió. Este era el dibujo."}{" "}
        Mañana hay otro.
      </p>
      <div className="my-6 flex justify-center">
        <div className="rounded-xl border-2 border-ink bg-tile p-4 shadow-[0_4px_0_0_var(--shadow-ink)]">
          <PixelArt rows={solutionRows(puzzle.solution, puzzle.width)} className="size-44" label="Dibujo del día" />
        </div>
      </div>
      <Button asChild size="lg">
        <Link href="/nonograma">Volver a los mundos</Link>
      </Button>
    </main>
  );
}
