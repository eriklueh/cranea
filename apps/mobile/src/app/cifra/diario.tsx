import { generateDaily } from "@cranea/core/cifra";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { Row } from "@/components/ui";
import { DailyGate } from "@/components/daily-gate";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { DigitTile } from "@/games/cifra/components/tiles";
import { dailyNumber, GAME_ID } from "@/games/cifra/data";

/** El diario se genera en el dispositivo con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export default function CifraDaily() {
  return (
    <>
      <Stack.Screen options={{ title: "Cifra del día" }} />
      <DailyGate
        gameId={GAME_ID}
        game="Cifra"
        home="/cifra"
        title={(date) => `Cifra del día #${dailyNumber(date)}`}
        reveal={(date) => (
          <Row gap={6} accessibilityLabel="Solución">
            {generateDaily(date).solution.map((d, i) => <DigitTile key={i} digit={d} tone="solution" />)}
          </Row>
        )}
      >
        {(date, practice) => <Play key={String(practice)} date={date} practice={practice} />}
      </DailyGate>
    </>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <CifraGame puzzle={puzzle} mode={mode} />;
}
