"use client";
import { useMemo } from "react";
import { generateDaily, WORLDS } from "@cranea/core/torres";
import { DailyGate } from "@/components/daily-gate";
import { plusLevelCount } from "@/lib/free-levels";
import { TorresGame } from "@/games/torres/components/torres-game";
import { dailyNumber, GAME_ID, LAUNCH_DATE } from "@/games/torres/data";
import { useT } from "@/lib/i18n";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export function DailyGame() {
  const t = useT();
  return (
    <DailyGate plusLevels={plusLevelCount(WORLDS)} gameId={GAME_ID} game="Torres" home="/torres" launch={LAUNCH_DATE} title={(date) => t("torres.dailyTitle", { n: dailyNumber(date) })}>
      {(date, practice) => <Play key={`${date}-${practice}`} date={date} practice={practice} />}
    </DailyGate>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <TorresGame puzzle={puzzle} mode={mode} />;
}
