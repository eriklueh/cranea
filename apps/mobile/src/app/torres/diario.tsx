import { generateDaily } from "@cranea/core/torres";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { gameTitle } from "@/components/game-header";
import { useLocale, useT } from "@/lib/i18n";
import { DailyGate } from "@/components/daily-gate";
import { Board } from "@/games/torres/components/board";
import { TorresGame } from "@/games/torres/components/torres-game";
import { dailyNumber, GAME_ID } from "@/games/torres/data";

/** El diario se genera en el dispositivo con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export default function TorresDaily() {
  const t = useT();
  const locale = useLocale();
  return (
    <>
      <Stack.Screen options={{ title: t("torres.dailyTitle") }} />
      <DailyGate
        gameId={GAME_ID}
        game="Torres"
        home="/torres"
        title={(date) => gameTitle("Torres", { kind: "daily", number: dailyNumber(date) }, locale)}
        reveal={(date) => <Solution date={date} />}
      >
        {(date, practice) => <Play key={`${date}-${practice}`} date={date} practice={practice} />}
      </DailyGate>
    </>
  );
}

function Solution({ date }: { date: string }) {
  const p = useMemo(() => generateDaily(date), [date]);
  return <Board size={p.size} clues={p.clues} givens={p.givens} values={p.solution} readOnly feedback={false} width={240} />;
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <TorresGame puzzle={puzzle} mode={mode} />;
}
