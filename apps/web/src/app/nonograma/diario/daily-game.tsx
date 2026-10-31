"use client";
import { useMemo } from "react";
import { generateDaily } from "@cranea/core/nonograma";
import { DailyGate } from "@/components/daily-gate";
import { NonogramaGame } from "@/games/nonograma/components/nonograma-game";
import { PixelArt, solutionRows } from "@/games/nonograma/components/pixel-art";
import { dailyNumber, GAME_ID } from "@/games/nonograma/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export function DailyGame() {
  return (
    <DailyGate
      gameId={GAME_ID}
      game="Nonograma"
      home="/nonograma"
      title={(date) => `Nonograma del día #${dailyNumber(date)}`}
      reveal={(date) => {
        const puzzle = generateDaily(date);
        return (
          <div className="rounded-xl border-2 border-ink bg-tile p-3">
            <PixelArt rows={solutionRows(puzzle.solution, puzzle.width)} className="size-36" label="Dibujo del día" />
          </div>
        );
      }}
    >
      {(date, practice) => <Play key={String(practice)} date={date} practice={practice} />}
    </DailyGate>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <NonogramaGame puzzle={puzzle} mode={mode} />;
}
