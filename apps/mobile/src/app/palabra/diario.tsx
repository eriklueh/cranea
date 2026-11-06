import { generatePalabraDaily } from "@cranea/core/palabra";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { Row } from "@/components/ui";
import { DailyGate } from "@/components/daily-gate";
import { LetterTile, PalabraGame } from "@/games/palabra/components/palabra-game";
import { dailyNumber, GAME_ID, getDictionary } from "@/games/palabra/data";
import { spanishOnly } from "@/components/spanish-only";

/** La palabra del día sale de la fecha UTC: la misma para todos. Cuenta la primera partida. */
function PalabraDaily() {
  return (
    <>
      <Stack.Screen options={{ title: "Palabra del día" }} />
      <DailyGate
        gameId={GAME_ID}
        game="Palabra"
        home="/palabra"
        title={(date) => `Palabra del día #${dailyNumber(date)}`}
        reveal={(date) => {
          const puzzle = generatePalabraDaily(date, getDictionary());
          return (
            <Row gap={6} accessibilityLabel={`La palabra era ${puzzle.display}`}>
              {[...puzzle.answer].map((l, i) => <LetterTile key={i} letter={l} tone="solution" />)}
            </Row>
          );
        }}
      >
        {(date, practice) => <Play key={String(practice)} date={date} practice={practice} />}
      </DailyGate>
    </>
  );
}

function Play({ date, practice }: { date: string; practice: boolean }) {
  const puzzle = useMemo(() => generatePalabraDaily(date, getDictionary()), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice }), [date, practice]);
  return <PalabraGame puzzle={puzzle} mode={mode} />;
}

/** En inglés, Palabra no está: ver SpanishOnly. */
export default spanishOnly("palabra", PalabraDaily);
