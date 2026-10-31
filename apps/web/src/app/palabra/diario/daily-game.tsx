"use client";
import { useMemo } from "react";
import { generatePalabraDaily } from "@cranea/core/palabra";
import { DailyGate } from "@/components/daily-gate";
import { Button } from "@/components/ui/button";
import { PalabraGame } from "@/games/palabra/components/palabra-game";
import { LetterTile } from "@/games/palabra/components/letter-tile";
import { dailyNumber, GAME_ID, LAUNCH_DATE } from "@/games/palabra/data";
import { useDictionary } from "@/games/palabra/dictionary";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export function DailyGame() {
  return (
    <DailyGate
      gameId={GAME_ID}
      game="Palabra"
      home="/palabra"
      launch={LAUNCH_DATE}
      title={(date) => `Palabra del día #${dailyNumber(date)}`}
      reveal={(date) => <Answer date={date} />}
    >
      {(date, practice) => <Play key={`${date}-${practice}`} date={date} practice={practice} />}
    </DailyGate>
  );
}

function Answer({ date }: { date: string }) {
  const { dict } = useDictionary();
  const puzzle = useMemo(() => (dict ? generatePalabraDaily(date, dict) : null), [date, dict]);
  if (!puzzle) return null;
  return (
    <div className="flex gap-1.5" role="img" aria-label={`La palabra era ${puzzle.display}`}>
      {[...puzzle.answer].map((letter, i) => <LetterTile key={i} letter={letter} tone="solution" />)}
    </div>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const { dict, failed, retry } = useDictionary();
  const puzzle = useMemo(() => (dict ? generatePalabraDaily(date, dict) : null), [date, dict]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  if (failed) {
    return (
      <main className="mx-auto max-w-md space-y-3 px-4 text-muted-foreground">
        <p role="alert">No se pudo cargar la lista de palabras.</p>
        <Button variant="outline" onClick={retry}>Reintentar</Button>
      </main>
    );
  }
  if (!puzzle) return <main className="mx-auto max-w-md px-4 pt-4 text-muted-foreground">Preparando el tablero…</main>;
  return <PalabraGame puzzle={puzzle} mode={mode} />;
}
