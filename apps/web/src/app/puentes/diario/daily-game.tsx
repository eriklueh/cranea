"use client";
import { useMemo } from "react";
import { generateDaily } from "@cranea/core/puentes";
import { DailyGate } from "@/components/daily-gate";
import { PuentesGame } from "@/games/puentes/components/puentes-game";
import { dailyNumber, GAME_ID } from "@/games/puentes/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export function DailyGame() {
  return (
    <DailyGate gameId={GAME_ID} game="Puentes" home="/puentes" title={(date) => `Puentes del día #${dailyNumber(date)}`}>
      {(date, practice) => <Play key={String(practice)} date={date} practice={practice} />}
    </DailyGate>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <PuentesGame puzzle={puzzle} mode={mode} />;
}
