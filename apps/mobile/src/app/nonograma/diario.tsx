import { generateDaily } from "@cranea/core/nonograma";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { DailyGate } from "@/components/daily-gate";
import { NonogramaGame, Picture } from "@/games/nonograma/components/nonograma-game";
import { dailyNumber, GAME_ID } from "@/games/nonograma/data";

/** El diario se genera en el dispositivo con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export default function NonogramaDaily() {
  return (
    <>
      <Stack.Screen options={{ title: "Nonograma del día" }} />
      <DailyGate
        gameId={GAME_ID}
        game="Nonograma"
        home="/nonograma"
        title={(date) => `Nonograma del día #${dailyNumber(date)}`}
        reveal={(date) => <Picture puzzle={generateDaily(date)} size={140} />}
      >
        {(date, practice) => <Play key={`${date}-${practice}`} date={date} practice={practice} />}
      </DailyGate>
    </>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <NonogramaGame puzzle={puzzle} mode={mode} />;
}
