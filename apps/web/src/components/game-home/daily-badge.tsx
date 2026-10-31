"use client";
import { CheckIcon, MoonIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { cn } from "@/lib/utils";
import { useGameProgress } from "@/stores/progress";
import { useClock } from "./use-clock";

/** Estado del diario de hoy en la tarjeta de cada juego del inicio. */
export function DailyBadge({ gameId }: { gameId: string }) {
  const now = useClock(60_000);
  const progress = useGameProgress(gameId);
  const base = "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold whitespace-nowrap";
  if (now === null) return <span aria-hidden className={cn(base, "w-20 bg-muted")} />;
  const played = progress.daily[todayKey(new Date(now))];
  if (!played) {
    return (
      <span className={cn(base, "border-2 border-dashed border-ink")}>
        <span aria-hidden className="size-1.5 rounded-full bg-margin" />
        <span className="sr-only">Diario de hoy: </span>Sin jugar
      </span>
    );
  }
  return played.won ? (
    <span className={cn(base, "bg-ok text-card")}>
      <CheckIcon aria-hidden className="size-3" strokeWidth={3} />
      <span className="sr-only">Diario de hoy: </span>Hecho
    </span>
  ) : (
    <span className={cn(base, "bg-pencil text-card")}>
      <MoonIcon aria-hidden className="size-3" />
      <span className="sr-only">Diario de hoy: </span>No salió
    </span>
  );
}
