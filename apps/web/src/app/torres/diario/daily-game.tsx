"use client";
import { useMemo } from "react";
import { generateDaily } from "@cranea/core/torres";
import { DailyGate } from "@/components/daily-gate";
import { TorresGame } from "@/games/torres/components/torres-game";
import { dailyNumber, GAME_ID } from "@/games/torres/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export function DailyGame() {
  return (
    <DailyGate gameId={GAME_ID} game="Torres" home="/torres" title={(date) => `Torres del día #${dailyNumber(date)}`}>
      {(date, practice) => <Play key={String(practice)} date={date} practice={practice} />}
    </DailyGate>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <TorresGame puzzle={puzzle} mode={mode} />;
}
