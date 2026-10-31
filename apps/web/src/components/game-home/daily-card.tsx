"use client";
import Link from "next/link";
import { CheckIcon, FlameIcon, MoonIcon, PlayIcon, TrophyIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { dailyStreak, type GameProgress } from "@/stores/progress";
import { formatCountdown, msToNextDaily } from "./progress";
import type { GameHomeConfig } from "./types";

/** Texto del enlace al tablero del diario ya jugado. Pasa a «Jugar de nuevo» cuando el diario tenga práctica. */
const REPLAY_LABEL = "Ver tablero";

/**
 * El desafío de hoy. Sin jugar es la acción principal de la pantalla; una vez jugado
 * se achica a una fila de resultado para que el próximo paso sea seguir con los niveles.
 */
export function DailyCard({ config, progress, now }: { config: GameHomeConfig; progress: GameProgress; now: number | null }) {
  const { daily, article } = config;
  const today = now === null ? null : todayKey(new Date(now));
  const headingId = `${config.id}-diario`;

  if (today === null) {
    return (
      <section aria-labelledby={headingId} aria-busy className="rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)]">
        <h2 id={headingId} className="font-display text-2xl font-extrabold">Desafío de hoy</h2>
        <div className="mt-1 h-6 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
        <div className="mt-4 h-12 rounded-lg bg-muted motion-safe:animate-pulse" />
      </section>
    );
  }

  const number = daily.number(today);
  const played = progress.daily[today];
  const streak = dailyStreak(progress.daily, today);

  if (!played) {
    const resume = daily.inProgress?.(today) ?? false;
    return (
      <section aria-labelledby={headingId} className="rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)]">
        <div className="flex items-start justify-between gap-3">
          <h2 id={headingId} className="font-display text-2xl leading-tight font-extrabold">
            Desafío de hoy <span className="text-base font-bold text-muted-foreground tabular-nums">#{number}</span>
          </h2>
          {streak > 0 && <Streak days={streak} className="mt-1" />}
        </div>
        <p className="mt-0.5 text-muted-foreground">
          {resume ? "Tenés una partida empezada." : streak > 0 ? "Jugalo para no cortar la racha." : daily.blurb}
        </p>
        <Button asChild size="lg" className="mt-4 h-12 w-full text-lg sm:w-auto sm:min-w-48">
          <Link href={daily.href}>
            <PlayIcon aria-hidden className="size-4 fill-current" />
            {resume ? "Seguir" : "Jugar"}
          </Link>
        </Button>
      </section>
    );
  }

  const won = played.won;
  const fem = article === "la";
  const result = config.resultText(played);
  return (
    <section aria-labelledby={headingId} className="rounded-xl bg-card/70 py-2 pr-1.5 pl-3 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn("grid size-9 shrink-0 place-items-center rounded-full text-card", won ? "bg-ok" : "bg-pencil")}
        >
          {won ? <CheckIcon className="size-5" strokeWidth={3} /> : <MoonIcon className="size-4.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-bold">
            Desafío de hoy <span className="font-normal text-muted-foreground tabular-nums">#{number}</span>
          </h2>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            {won ? (
              <span className="text-foreground">
                {/* El tilde ya dice que salió: a la vista queda el dato ("1 intento", "sin errores"). */}
                <span className="sr-only">{fem ? "Resuelta" : "Resuelto"} {result.startsWith("en ") && "en "}</span>
                {result.replace(/^en /, "")}
              </span>
            ) : (
              <span className="text-foreground">No salió</span>
            )}
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              <span className="sr-only">Tiempo: </span>
              {formatTime(played.timeMs)}
            </span>
            {streak > 0 && (
              <>
                <span aria-hidden>·</span>
                <Streak days={streak} compact />
              </>
            )}
          </p>
        </div>
        <Button asChild variant="ghost" className="h-11 shrink-0 px-2.5">
          <Link href={`/ranking?juego=${config.id}`}>
            <TrophyIcon aria-hidden className="text-clue-present" />
            Ranking
          </Link>
        </Button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 border-t border-dashed border-border pt-1 pl-12 text-sm text-muted-foreground">
        <p>
          {fem ? "La próxima" : "El próximo"} en{" "}
          <span className="font-semibold text-foreground tabular-nums">{formatCountdown(msToNextDaily(now!))}</span>
        </p>
        <Link
          href={daily.href}
          className="-my-1 inline-flex min-h-11 shrink-0 items-center rounded-md px-2.5 font-semibold underline decoration-border decoration-2 underline-offset-4 outline-none hover:text-foreground hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {REPLAY_LABEL}
        </Link>
      </div>
    </section>
  );
}

function Streak({ days, compact, className }: { days: number; compact?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 font-semibold text-clue-present tabular-nums",
        !compact && "rounded-full bg-clue-present-bg px-2 py-0.5 text-sm",
        className,
      )}
    >
      <FlameIcon aria-hidden className="size-3.5" />
      {days}
      <span className="sr-only"> {days === 1 ? "día" : "días"} de racha</span>
    </span>
  );
}
