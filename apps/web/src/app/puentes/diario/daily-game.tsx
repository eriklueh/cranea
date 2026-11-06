"use client";
import { useMemo } from "react";
import { generateDaily, WORLDS } from "@cranea/core/puentes";
import { DailyGate } from "@/components/daily-gate";
import { useT } from "@/lib/i18n";
import { plusLevelCount } from "@/lib/free-levels";
import { PuentesGame } from "@/games/puentes/components/puentes-game";
import { dailyNumber, GAME_ID, LAUNCH_DATE } from "@/games/puentes/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export function DailyGame() {
  const t = useT();
  return (
    <DailyGate plusLevels={plusLevelCount(WORLDS)} gameId={GAME_ID} game="Puentes" home="/puentes" launch={LAUNCH_DATE} title={(date) => t("puentes.dailyTitle", { n: dailyNumber(date) })}>
      {(date, practice) => <Play key={`${date}-${practice}`} date={date} practice={practice} />}
    </DailyGate>
  );
}

/** Mientras se lee ?fecha=: «Preparando el tablero…». */
export function DailyFallback() {
  const t = useT();
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4 text-muted-foreground" aria-busy>
      {t("puentes.preparing")}
    </main>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <PuentesGame puzzle={puzzle} mode={mode} />;
}
