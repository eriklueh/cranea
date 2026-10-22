"use client";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import { WORLDS } from "@cranea/core/cifra";
import { todayKey } from "@cranea/core";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn, formatTime } from "@/lib/utils";
import { dailyStreak, useGameProgress } from "@/stores/progress";
import { dailyNumber, isLevelUnlocked, isWorldUnlocked, levelKey } from "../data";

export function DailyCard() {
  const hydrated = useHydrated();
  const progress = useGameProgress("cifra");
  const today = hydrated ? todayKey() : null;
  const played = today ? progress.daily[today] : undefined;
  const streak = today ? dailyStreak(progress.daily, today) : 0;

  return (
    <section className="rounded-xl border-2 border-ink bg-card p-5 shadow-[0_4px_0_0_var(--shadow-ink)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl font-extrabold">
          Cifra del día {today && <span className="text-muted-foreground">#{dailyNumber(today)}</span>}
        </h2>
        {streak > 0 && <p className="text-sm font-semibold">Racha de {streak} {streak === 1 ? "día" : "días"}</p>}
      </div>
      <p className="mt-1 mb-4 text-muted-foreground">
        {played
          ? played.won
            ? `Resuelto en ${played.attempts} ${played.attempts === 1 ? "intento" : "intentos"}, ${formatTime(played.timeMs)}. Mañana hay otro.`
            : "Hoy no salió. Mañana hay otro."
          : "Un tablero nuevo cada día, el mismo para todos. Tres intentos."}
      </p>
      <Button asChild size="lg" variant={played ? "outline" : "default"}>
        <Link href="/cifra/diario">{played ? "Ver el de hoy" : "Jugar el de hoy"}</Link>
      </Button>
    </section>
  );
}

export function WorldMap() {
  const hydrated = useHydrated();
  const progress = useGameProgress("cifra");
  const done = (w: number, l: number) => hydrated && Boolean(progress.levels[levelKey(w, l)]?.won);

  return (
    <div className="space-y-10">
      {WORLDS.map((world) => {
        const open = isWorldUnlocked(world.id, done);
        let completed = 0;
        for (let n = 1; n <= world.levels; n++) if (done(world.id, n)) completed++;
        return (
          <section key={world.id} aria-labelledby={`mundo-${world.id}`}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 id={`mundo-${world.id}`} className="font-display text-xl font-extrabold">
                <span className="mr-2 text-margin">{world.id}</span>
                {world.name}
              </h2>
              <span className="text-sm text-muted-foreground tabular-nums">
                {completed}/{world.levels}
              </span>
            </div>
            <p className="mb-3 max-w-prose text-muted-foreground">
              {open ? world.description : `Completá ${world.unlockAfter} niveles del mundo ${world.id - 1} para abrirlo.`}
            </p>
            <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
              {Array.from({ length: world.levels }, (_, i) => {
                const n = i + 1;
                const result = progress.levels[levelKey(world.id, n)];
                const won = hydrated && result?.won;
                const unlocked = hydrated && isLevelUnlocked(world.id, n, done);
                const stars = won ? 4 - result.attempts : 0;
                const cls = cn(
                  "relative grid aspect-square place-items-center rounded-md font-display text-base font-bold tabular-nums transition-colors",
                  won && "border-2 border-ink bg-tile shadow-[0_2px_0_0_var(--shadow-ink)]",
                  !won && unlocked && "border-2 border-dashed border-ink hover:bg-accent",
                  !unlocked && "text-pencil/50",
                );
                return (
                  <li key={n}>
                    {unlocked ? (
                      <Link
                        href={`/cifra/nivel/${world.id}/${n}`}
                        className={cls}
                        aria-label={`Nivel ${n}${won ? `, resuelto en ${result.attempts} intentos` : ""}`}
                      >
                        {n}
                        {won && (
                          <span aria-hidden className="absolute bottom-1 flex gap-0.5">
                            {Array.from({ length: stars }, (_, k) => (
                              <span key={k} className="size-1 rounded-full bg-ok" />
                            ))}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className={cls} aria-label={`Nivel ${n}, bloqueado`}>
                        {n === 1 && !open ? <LockIcon className="size-4" /> : n}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
