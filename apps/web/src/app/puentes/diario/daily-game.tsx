"use client";
import { useMemo } from "react";
import { generateDaily } from "@cranea/core/puentes";
import { DailyGate } from "@/components/daily-gate";
import { PuentesGame } from "@/games/puentes/components/puentes-game";
import { dailyNumber, GAME_ID } from "@/games/puentes/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Se juega una vez por día. */
export function DailyGame() {
  return (
    <DailyGate gameId={GAME_ID} game="Puentes" home="/puentes" title={(date) => `Puentes del día #${dailyNumber(date)}`}>
      {(date) => <Play date={date} />}
    </DailyGate>
  );
}

function Play({ date }: { date: string }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date) }), [date]);
  return <PuentesGame puzzle={puzzle} mode={mode} />;
}
