"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { todayKey } from "@cranea/core";
import { generatePalabraDaily } from "@cranea/core/palabra";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatTime } from "@/lib/utils";
import { PalabraGame } from "@/games/palabra/components/palabra-game";
import { LetterTile } from "@/games/palabra/components/letter-tile";
import { dailyNumber, GAME_ID } from "@/games/palabra/data";
import { useDictionary } from "@/games/palabra/dictionary";
import { useProgress, type Result } from "@/stores/progress";

/**
 * El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero.
 * Se juega una vez: si al entrar ya hay resultado de hoy, se muestra en lugar del tablero.
 */
export function DailyGame() {
  const hydrated = useHydrated();
  const date = hydrated ? todayKey() : null;
  const { dict, failed, retry } = useDictionary();
  // Se lee al entrar, no en vivo: terminar la partida no reemplaza el tablero por el resumen.
  const [played, setPlayed] = useState<Result | null | undefined>(undefined);
  useEffect(() => {
    if (date) setPlayed(useProgress.getState().games[GAME_ID]?.daily[date] ?? null);
  }, [date]);

  const puzzle = useMemo(() => (date && dict ? generatePalabraDaily(date, dict) : null), [date, dict]);
  const mode = useMemo(() => (date ? { kind: "daily" as const, date, number: dailyNumber(date) } : null), [date]);

  if (failed) {
    return (
      <main className="mx-auto max-w-md space-y-3 px-4 text-muted-foreground sm:pl-16">
        <p role="alert">No se pudo cargar la lista de palabras.</p>
        <Button variant="outline" onClick={retry}>Reintentar</Button>
      </main>
    );
  }
  if (!puzzle || !mode || played === undefined) return <main className="mx-auto max-w-md px-4 text-muted-foreground sm:pl-16">Preparando el tablero…</main>;

  if (played) {
    return (
      <main className="mx-auto w-full max-w-md space-y-5 px-4 pb-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Palabra del día #{mode.number}</h1>
        <p className="text-muted-foreground">
          {played.won
            ? `Ya la resolviste hoy, en ${played.attempts} ${played.attempts === 1 ? "intento" : "intentos"} y ${formatTime(played.timeMs)}.`
            : "Ya jugaste la de hoy."}{" "}
          Mañana hay otra.
        </p>
        <div className="flex gap-1.5" role="img" aria-label={`La palabra era ${puzzle.display}`}>
          {[...puzzle.answer].map((letter, i) => (
            <LetterTile key={i} letter={letter} tone="solution" />
          ))}
        </div>
        <Button asChild size="lg">
          <Link href="/palabra">Volver a los mundos</Link>
        </Button>
      </main>
    );
  }

  return <PalabraGame puzzle={puzzle} mode={mode} />;
}
