import { generateDaily } from "@cranea/core/nonograma";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { gameTitle } from "@/components/game-header";
import { useLocale, useT } from "@/lib/i18n";
import { DailyGate } from "@/components/daily-gate";
import { NonogramaGame, Picture } from "@/games/nonograma/components/nonograma-game";
import { dailyNumber, GAME_ID } from "@/games/nonograma/data";

/** El diario se genera en el dispositivo con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export default function NonogramaDaily() {
  const t = useT();
  const locale = useLocale();
  return (
    <>
      <Stack.Screen options={{ title: t("nonograma.dailyTitle") }} />
      <DailyGate
        gameId={GAME_ID}
        game="Nonograma"
        home="/nonograma"
        title={(date) => gameTitle("Nonograma", { kind: "daily", number: dailyNumber(date) }, locale)}
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
