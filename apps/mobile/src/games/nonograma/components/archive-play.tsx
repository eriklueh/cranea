import { generateDaily } from "@cranea/core/nonograma";
import { useMemo } from "react";
import { dailyNumber } from "../data";
import { NonogramaGame } from "./nonograma-game";

/** Un diario de otro día, como práctica (Craneá Plus): no se guarda ni cuenta para el ranking. */
export function NonogramaArchivePlay({ date }: { date: string }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: dailyNumber(date), practice: true }), [date]);
  return <NonogramaGame puzzle={puzzle} mode={mode} />;
}
