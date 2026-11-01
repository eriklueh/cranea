import { generateDaily, rowsFromIslands } from "@cranea/core/puentes";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { DailyGate } from "@/components/daily-gate";
import { PuentesGame } from "@/games/puentes/components/puentes-game";
import { StaticBoard } from "@/games/puentes/components/preview";
import { useBoardWidth } from "@/games/puentes/components/geometry";
import { dailyNumber, GAME_ID } from "@/games/puentes/data";

/** El diario se genera con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export default function PuentesDaily() {
  return (
    <>
      <Stack.Screen options={{ title: "Puentes del día" }} />
      <DailyGate
        gameId={GAME_ID}
        game="Puentes"
        home="/puentes"
        title={(date) => `Puentes del día #${dailyNumber(date)}`}
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
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const width = useBoardWidth(puzzle.width, 100);
  return (
    <StaticBoard
      rows={rowsFromIslands(puzzle)}
      bridges={puzzle.solution}
      done={puzzle.islands.map((_, i) => i)}
      width={width}
      label="La solución del mapa de hoy"
    />
  );
}
