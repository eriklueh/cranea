"use client";
import { useMemo } from "react";
import { generateDaily } from "@cranea/core/torres";
import { DailyGate } from "@/components/daily-gate";
import { TorresGame } from "@/games/torres/components/torres-game";
import { dailyNumber, GAME_ID } from "@/games/torres/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Se juega una vez. */
export function DailyGame() {
  return (
    <DailyGate gameId={GAME_ID} game="Torres" home="/torres" title={(date) => `Torres del día #${dailyNumber(date)}`}>
      {(date) => <Play date={date} />}
    </DailyGate>
  );
}

function Play({ date }: { date: string }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date) }), [date]);
  return <TorresGame puzzle={puzzle} mode={mode} />;
}
