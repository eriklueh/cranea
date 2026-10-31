"use client";
import Link from "next/link";
import { CheckIcon, FlameIcon, MoonIcon, PlayIcon, TrophyIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { dailyStreak, type GameProgress } from "@/stores/progress";
import { formatCountdown, msToNextDaily } from "./progress";
import { plural, type GameHomeConfig } from "./types";

const CARD = "rounded-xl border-2 border-ink bg-card p-4 sm:p-5";
const RAISED = "shadow-[0_4px_0_0_var(--shadow-ink)]";

/** La acción principal de la pantalla: el desafío de hoy. Cuando ya se jugó, queda "cerrado" y muestra el resultado. */
export function DailyCard({ config, progress, now }: { config: GameHomeConfig; progress: GameProgress; now: number | null }) {
  const { daily, article } = config;
  const today = now === null ? null : todayKey(new Date(now));
  const headingId = `${config.id}-diario`;

  if (today === null) {
    return (
      <section aria-labelledby={headingId} aria-busy className={cn(CARD, RAISED)}>
        <Eyebrow />
        <h2 id={headingId} className="font-display text-2xl font-extrabold">{daily.title}</h2>
        <div className="mt-2 h-5 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
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
      <section aria-labelledby={headingId} className={cn(CARD, RAISED)}>
        <Eyebrow number={number}>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-clue-present-bg px-2 py-0.5 text-sm font-semibold text-clue-present">
              <FlameIcon aria-hidden className="size-3.5" />
              {plural(streak, "día", "días")}
              <span className="sr-only"> de racha</span>
            </span>
          )}
        </Eyebrow>
        <h2 id={headingId} className="font-display text-2xl font-extrabold">{daily.title}</h2>
        <p className="mt-1 text-muted-foreground">
          {resume ? "Tenés una partida empezada." : streak > 0 ? `${daily.blurb} Jugalo para seguir la racha.` : daily.blurb}
        </p>
        <Button asChild size="lg" className="mt-4 w-full text-lg sm:w-auto sm:min-w-48">
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
  const stat = config.resultStat(played);
  return (
    <section
      aria-labelledby={headingId}
      className={cn(CARD, "border-dashed", won ? "bg-clue-exact-bg/60" : "bg-muted/60")}
    >
      <Eyebrow number={number}>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold",
            won ? "bg-ok text-card" : "bg-pencil text-card",
          )}
        >
          {won ? <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} /> : <MoonIcon aria-hidden className="size-3.5" />}
          {won ? (fem ? "Resuelta" : "Resuelto") : "No salió"}
        </span>
      </Eyebrow>
      <h2 id={headingId} className="font-display text-2xl font-extrabold">{daily.title}</h2>
      <p className="mt-1 text-muted-foreground">
        {won ? `${fem ? "Resuelta" : "Resuelto"} ${config.resultText(played)}.` : `Esta vez no salió. Mañana hay ${fem ? "otra" : "otro"}.`}
      </p>

      <dl className="mt-3 grid grid-cols-3 divide-x-2 divide-dashed divide-border rounded-lg border-2 border-border bg-card text-center">
        <Stat label={stat.label} value={stat.value} />
        <Stat label="Tiempo" value={formatTime(played.timeMs)} />
        <Stat label="Racha" value={String(streak)} icon={streak > 0} />
      </dl>

      <div className="mt-3 flex items-center gap-2">
        <Button asChild variant="outline" className="h-11 flex-1 sm:flex-none">
          <Link href={`/ranking?juego=${config.id}`}>
            <TrophyIcon aria-hidden />
            Ver ranking
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-11 text-muted-foreground">
          <Link href={daily.href}>Ver tablero</Link>
        </Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="off">
        {fem ? "La próxima" : "El próximo"} en <span className="font-semibold text-foreground tabular-nums">{formatCountdown(msToNextDaily(now!))}</span>
      </p>
    </section>
  );
}

function Eyebrow({ number, children }: { number?: number; children?: React.ReactNode }) {
  return (
    <div className="mb-0.5 flex min-h-6 items-center justify-between gap-3">
      <p className="text-xs font-bold tracking-wider text-margin uppercase">
        Desafío de hoy{number !== undefined && <span className="text-muted-foreground"> · #{number}</span>}
      </p>
      {children}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="px-1 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center justify-center gap-1 font-display text-xl font-bold tabular-nums">
        {icon && <FlameIcon aria-hidden className="size-4 text-clue-present" />}
        {value}
      </dd>
    </div>
  );
}
