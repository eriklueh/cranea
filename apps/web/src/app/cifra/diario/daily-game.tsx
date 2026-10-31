"use client";
import { useMemo } from "react";
import { generateDaily } from "@cranea/core/cifra";
import { DailyGate } from "@/components/daily-gate";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { DigitTile } from "@/games/cifra/components/digit-tile";
import { dailyNumber } from "@/games/cifra/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Se juega una vez. */
export function DailyGame() {
  return (
    <DailyGate
      gameId="cifra"
      game="Cifra"
      home="/cifra"
      title={(date) => `Cifra del día #${dailyNumber(date)}`}
      reveal={(date) => (
        <div className="flex gap-1.5" aria-label="Solución">
          {generateDaily(date).solution.map((d, i) => <DigitTile key={i} digit={d} tone="solution" />)}
        </div>
      )}
    >
      {(date) => <Play date={date} />}
    </DailyGate>
  );
}

function Play({ date }: { date: string }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date) }), [date]);
  return <CifraGame puzzle={puzzle} mode={mode} />;
}
