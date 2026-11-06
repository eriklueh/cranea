"use client";
import { useMemo } from "react";
import { generateDaily, WORLDS } from "@cranea/core/cifra";
import { DailyGate } from "@/components/daily-gate";
import { useT } from "@/lib/i18n";
import { plusLevelCount } from "@/lib/free-levels";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { DigitTile } from "@/games/cifra/components/digit-tile";
import { dailyNumber, LAUNCH_DATE } from "@/games/cifra/data";

/** El diario se genera en el cliente con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export function DailyGame() {
  const t = useT();
  return (
    <DailyGate plusLevels={plusLevelCount(WORLDS)}
      gameId="cifra"
      game="Cifra"
      home="/cifra"
      launch={LAUNCH_DATE}
      title={(date) => t("cifra.dailyTitle", { n: dailyNumber(date) })}
      reveal={(date) => (
        <div className="flex gap-1.5" aria-label={t("cifra.solution")}>
          {generateDaily(date).solution.map((d, i) => <DigitTile key={i} digit={d} tone="solution" />)}
        </div>
      )}
    >
      {(date, practice) => <Play key={`${date}-${practice}`} date={date} practice={practice} />}
    </DailyGate>
  );
}

/** Mientras se lee ?fecha=: «Preparando el tablero…». */
export function DailyFallback() {
  const t = useT();
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4 text-muted-foreground" aria-busy>
      {t("cifra.preparing")}
    </main>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <CifraGame puzzle={puzzle} mode={mode} />;
}
