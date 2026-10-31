"use client";
import Link from "next/link";
import { ArchiveIcon, ChevronRightIcon, CircleHelpIcon, PartyPopperIcon, SparklesIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { openPaywall } from "@/components/plus/paywall";
import { useHydrated } from "@/hooks/use-hydrated";
import { PLUS_PRICE, usePlus } from "@/lib/plus";
import { cn } from "@/lib/utils";
import { useGameProgress } from "@/stores/progress";
import { DailyCard } from "./daily-card";
import { nextLevel } from "./progress";
import type { GameHomeConfig } from "./types";
import { useClock } from "./use-clock";
import { WorldMap } from "./world-map";

/**
 * Pantalla de inicio de un juego, pensada primero para el celular. El nombre vive en la miga
 * del encabezado; acá hay una sola acción principal por vez: el diario si falta jugarlo,
 * y si no, seguir con los niveles. Debajo, los mundos.
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
  const { plus, ready } = usePlus();
  const unit = config.unit ?? { one: "nivel", many: "niveles" };
  const totalLevels = config.worlds.reduce((sum, w) => sum + w.levels, 0);

  const upsell = (
    <button
      type="button"
      onClick={() => openPaywall("levels")}
      aria-haspopup="dialog"
      className="group flex w-full min-w-0 items-center gap-3 rounded-xl border-2 border-border bg-card p-2.5 pr-3 text-left outline-none hover:border-ink focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-lg bg-clue-present-bg text-clue-present">
        <SparklesIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Más {unit.many} con Plus</span>
        <span className="block text-sm text-muted-foreground">
          {totalLevels} en {config.worlds.length} mundos, <span className="whitespace-nowrap">{PLUS_PRICE}</span>
        </span>
      </span>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-pencil transition-transform group-hover:translate-x-0.5" />
    </button>
  );

  const continueCard = !hydrated || !ready ? (
    <div aria-hidden className="h-[68px] rounded-xl border-2 border-border bg-card motion-safe:animate-pulse" />
  ) : !plus ? (
    upsell
  ) : next ? (
    <Link
      href={config.levelHref(next.world.id, next.level)}
      className={cn(
        "group flex items-center gap-3 rounded-xl border-2 bg-card p-2.5 pr-3 outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50",
        dailyDone
          ? "border-ink shadow-[0_4px_0_0_var(--shadow-ink)] hover:-translate-y-0.5"
          : "border-border hover:border-ink",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-lg font-display text-xl font-extrabold tabular-nums",
          dailyDone ? "bg-ink text-paper" : "bg-muted",
        )}
      >
        {next.level}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{fresh ? "Empezar los niveles" : "Seguir jugando"}</span>
        <span className="block truncate text-sm text-muted-foreground">
          Mundo {worldIndex + 1} · Nivel {next.level}
        </span>
      </span>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-pencil transition-transform group-hover:translate-x-0.5" />
    </Link>
  ) : (
    <p className="flex items-center gap-2 rounded-xl bg-clue-exact-bg/60 px-4 py-3 font-semibold">
      <PartyPopperIcon aria-hidden className="size-5 text-ok" />
      Completaste todos los mundos.
    </p>
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-1 pb-16 sm:pr-6 sm:pl-16">
      <h1 className="sr-only">{config.name}</h1>

      {/* Lo pendiente va primero: el diario sin jugar, o seguir con los niveles si ya está hecho. Sin Plus, el diario siempre arriba. */}
      <div className="grid gap-3">
        {dailyDone && plus ? (
          <>
            {continueCard}
            <DailyCard config={config} progress={progress} now={now} />
          </>
        ) : (
          <>
            <DailyCard config={config} progress={progress} now={now} />
            {continueCard}
          </>
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <Link
          href={`/${config.id}/archivo`}
          className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ArchiveIcon aria-hidden className="size-4" />
          Diarios anteriores
        </Link>
      </div>

      <div className="mt-5">
        <WorldMap
          config={config}
          progress={progress}
          hydrated={hydrated}
          initialWorld={next?.world.id ?? config.worlds[0].id}
          nextKey={next && plus ? `${next.world.id}-${next.level}` : null}
          needsPlus={!plus}
          aside={
            <Link
              href={`/${config.id}/como-jugar`}
              className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <CircleHelpIcon aria-hidden className="size-4" />
              Cómo se juega
            </Link>
          }
        />
      </div>
    </main>
  );
}
