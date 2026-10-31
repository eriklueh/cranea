"use client";
import Link from "next/link";
import { BookOpenIcon, ChartColumnIcon, ChevronRightIcon, PartyPopperIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useGameProgress } from "@/stores/progress";
import { DailyCard } from "./daily-card";
import { nextLevel } from "./progress";
import type { GameHomeConfig } from "./types";
import { useClock } from "./use-clock";
import { WorldMap } from "./world-map";

/**
 * Pantalla de inicio de un juego, pensada primero para el celular:
 * nombre y una línea, el desafío de hoy, un atajo al próximo nivel y los mundos.
 */
export function GameHome({ config }: { config: GameHomeConfig }) {
  const hydrated = useHydrated();
  const now = useClock();
  const progress = useGameProgress(config.id);
  const next = hydrated ? nextLevel(config, progress) : null;
  const today = now === null ? null : todayKey(new Date(now));
  const dailyDone = Boolean(today && progress.daily[today]);
  const worldIndex = next ? config.worlds.indexOf(next.world) : -1;
  const fresh = Object.keys(progress.levels).length === 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-1 pb-16 sm:pr-6 sm:pl-16">
      <header>
        <h1 className="font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">{config.name}</h1>
        <p className="mt-2 text-muted-foreground sm:text-lg">{config.pitch}</p>
        <nav aria-label={`Más sobre ${config.name}`} className="-ml-2 mt-1 flex flex-wrap gap-x-1">
          <SecondaryLink href={`/${config.id}/como-jugar`} icon={<BookOpenIcon />}>Cómo se juega</SecondaryLink>
          <SecondaryLink href={`/estadisticas#${config.id}`} icon={<ChartColumnIcon />}>Estadísticas</SecondaryLink>
        </nav>
      </header>

      <div className="mt-3 grid gap-3">
        <DailyCard config={config} progress={progress} now={now} />

        {!hydrated ? (
          <div aria-hidden className="h-[68px] rounded-xl border-2 border-border bg-card motion-safe:animate-pulse" />
        ) : next ? (
          <Link
            href={config.levelHref(next.world.id, next.level)}
            className={cn(
              "group flex items-center gap-3 rounded-xl border-2 border-ink bg-card p-2.5 pr-3 outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50",
              dailyDone ? "shadow-[0_4px_0_0_var(--shadow-ink)] hover:-translate-y-0.5" : "shadow-[0_2px_0_0_var(--shadow-ink)] hover:-translate-y-px",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-lg font-display text-xl font-extrabold tabular-nums",
                dailyDone ? "bg-ink text-paper" : "border-2 border-dashed border-ink",
              )}
            >
              {next.level}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{fresh ? "Empezar los niveles" : "Seguir jugando"}</span>
              <span className="block truncate text-sm text-muted-foreground">
                Mundo {worldIndex + 1} · Nivel {next.level} · {next.world.name}
              </span>
            </span>
            <ChevronRightIcon aria-hidden className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border-2 border-dashed border-ok/60 bg-clue-exact-bg/50 px-4 py-3 font-semibold">
            <PartyPopperIcon aria-hidden className="size-5 text-ok" />
            Completaste todos los mundos.
          </p>
        )}
      </div>

      <div className="mt-8">
        <WorldMap
          config={config}
          progress={progress}
          hydrated={hydrated}
          initialWorld={next?.world.id ?? config.worlds[0].id}
          nextKey={next ? `${next.world.id}-${next.level}` : null}
        />
      </div>
    </main>
  );
}

function SecondaryLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:text-pencil"
    >
      {icon}
      {children}
    </Link>
  );
}
