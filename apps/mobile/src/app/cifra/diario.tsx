import { generateDaily } from "@cranea/core/cifra";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { gameTitle } from "@/components/game-header";
import { useLocale, useT } from "@/lib/i18n";
import { Row } from "@/components/ui";
import { DailyGate } from "@/components/daily-gate";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { DigitTile } from "@/games/cifra/components/tiles";
import { dailyNumber, GAME_ID } from "@/games/cifra/data";

/** El diario se genera en el dispositivo con la fecha UTC como semilla: todos ven el mismo tablero. Cuenta la primera partida. */
export default function CifraDaily() {
  const t = useT();
  const locale = useLocale();
  return (
    <>
      <Stack.Screen options={{ title: t("cifra.dailyTitle") }} />
      <DailyGate
        gameId={GAME_ID}
        game="Cifra"
        home="/cifra"
        title={(date) => gameTitle("Cifra", { kind: "daily", number: dailyNumber(date) }, locale)}
        reveal={(date) => (
          <Row gap={6} accessibilityLabel={t("cifra.solution")}>
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
