import { todayKey } from "@cranea/core";
import { generateDaily } from "@cranea/core/cifra";
import { generatePalabraDaily } from "@cranea/core/palabra";
import { generateDaily as generateTorresDaily } from "@cranea/core/torres";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { Loading } from "@/components/ui";
import { usePlus, usePlusReady } from "@/entitlements";
import { ARCHIVE, isArchiveDate } from "@/games/archive";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { PalabraGame } from "@/games/palabra/components/palabra-game";
import { getDictionary } from "@/games/palabra/data";
import { TorresGame } from "@/games/torres/components/torres-game";
import { PuentesArchive } from "@/games/puentes/archive";
import { NonogramaArchivePlay } from "@/games/nonograma/components/archive-play";

/** Un diario de otro día, como práctica (Craneá Plus): no se guarda ni cuenta para el ranking. */
export default function ArchiveDaily() {
  const { game, fecha } = useLocalSearchParams<{ game: string; fecha: string }>();
  const info = ARCHIVE[game];
  const plus = usePlus();
  const ready = usePlusReady();
  if (!info || !isArchiveDate(info.launch, fecha, todayKey())) return <NotFound title="Diario inexistente" />;
  if (!ready) return <Loading label="Preparando el tablero…" />;
  if (!plus) return <PlusGate title="Diarios anteriores" message="Con Craneá Plus podés jugar los desafíos de días anteriores para practicar." reason="archivo" />;
  if (game === "torres") return <Torres date={fecha} />;
  if (game === "puentes") return <PuentesArchive date={fecha} />;
  if (game === "nonograma") return <NonogramaArchivePlay date={fecha} />;
  return game === "cifra" ? <Cifra date={fecha} /> : <Palabra date={fecha} />;
}

function Cifra({ date }: { date: string }) {
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: ARCHIVE.cifra.number(date), practice: true }), [date]);
  return <CifraGame puzzle={puzzle} mode={mode} />;
}

function Palabra({ date }: { date: string }) {
  const puzzle = useMemo(() => generatePalabraDaily(date, getDictionary()), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: ARCHIVE.palabra.number(date), practice: true }), [date]);
  return <PalabraGame puzzle={puzzle} mode={mode} />;
}

function Torres({ date }: { date: string }) {
  const puzzle = useMemo(() => generateTorresDaily(date), [date]);
  const mode = useMemo(() => ({ kind: "daily" as const, date, number: ARCHIVE.torres.number(date), practice: true }), [date]);
  return <TorresGame puzzle={puzzle} mode={mode} />;
}
