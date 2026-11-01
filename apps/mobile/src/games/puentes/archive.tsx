import { generateDaily } from "@cranea/core/puentes";
import { useMemo } from "react";
import { PuentesGame } from "./components/puentes-game";
import { dailyNumber } from "./data";

/** Un diario de Puentes de otro día (archivo, Craneá Plus): práctica, no se guarda ni cuenta para el ranking. */
export function PuentesArchive({ date }: { date: string }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice: true }), [date]);
  return <PuentesGame key={date} puzzle={puzzle} mode={mode} />;
}
