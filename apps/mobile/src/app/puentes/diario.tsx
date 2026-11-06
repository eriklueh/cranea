import { generateDaily, rowsFromIslands } from "@cranea/core/puentes";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { gameTitle } from "@/components/game-header";
import { useLocale, useT } from "@/lib/i18n";
import { DailyGate } from "@/components/daily-gate";
import { PuentesGame } from "@/games/puentes/components/puentes-game";
import { StaticBoard } from "@/games/puentes/components/preview";
import { useBoardWidth } from "@/games/puentes/components/geometry";
import { dailyNumber, GAME_ID } from "@/games/puentes/data";

/** El diario se genera con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export default function PuentesDaily() {
  const t = useT();
  const locale = useLocale();
  return (
    <>
      <Stack.Screen options={{ title: t("puentes.dailyTitle") }} />
      <DailyGate
        gameId={GAME_ID}
        game="Puentes"
        home="/puentes"
        title={(date) => gameTitle("Puentes", { kind: "daily", number: dailyNumber(date) }, locale)}
        reveal={(date) => <Solution date={date} />}
      >
        {(date, practice) => <Play key={`${date}-${practice}`} date={date} practice={practice} />}
      </DailyGate>
    </>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <PuentesGame puzzle={puzzle} mode={mode} />;
}

/** Ya jugado: la solución de hoy, como en la web (que la muestra en el tablero). */
function Solution({ date }: { date: string }) {
  const t = useT();
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const width = useBoardWidth(puzzle.width, 100);
  return (
    <StaticBoard
      rows={rowsFromIslands(puzzle)}
      bridges={puzzle.solution}
      done={puzzle.islands.map((_, i) => i)}
      width={width}
      label={t("puentes.solutionLabel")}
    />
  );
}
