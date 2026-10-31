"use client";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import { PALABRA_WORLDS } from "@cranea/core/palabra";
import { todayKey } from "@cranea/core";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn, formatTime } from "@/lib/utils";
import { dailyStreak, useGameProgress } from "@/stores/progress";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey } from "../data";

export function DailyCard() {
  const hydrated = useHydrated();
  const progress = useGameProgress(GAME_ID);
  const today = hydrated ? todayKey() : null;
  const played = today ? progress.daily[today] : undefined;
  const streak = today ? dailyStreak(progress.daily, today) : 0;

  return (
    <section className="rounded-xl border-2 border-ink bg-card p-5 shadow-[0_4px_0_0_var(--shadow-ink)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl font-extrabold">
          Palabra del día {today && <span className="text-muted-foreground">#{dailyNumber(today)}</span>}
        </h2>
        {streak > 0 && <p className="text-sm font-semibold">Racha de {streak} {streak === 1 ? "día" : "días"}</p>}
      </div>
      <p className="mt-1 mb-4 text-muted-foreground">
        {played
          ? played.won
            ? `Resuelta en ${played.attempts} ${played.attempts === 1 ? "intento" : "intentos"}, ${formatTime(played.timeMs)}. Mañana hay otra.`
            : "Hoy no salió. Mañana hay otra."
          : "Una palabra nueva cada día, la misma para todos. Una sola partida, tres intentos."}
      </p>
      <Button asChild size="lg" variant={played ? "outline" : "default"}>
        <Link href="/palabra/diario">{played ? "Ver la de hoy" : "Jugar la de hoy"}</Link>
      </Button>
    </section>
  );
}

export function WorldMap() {
  const hydrated = useHydrated();
  const progress = useGameProgress(GAME_ID);
  const done = (w: number, l: number) => hydrated && Boolean(progress.levels[levelKey(w, l)]?.won);

  return (
    <div className="space-y-10">
      {PALABRA_WORLDS.map((world, index) => {
        const open = isWorldUnlocked(world.id, done);
        let completed = 0;
        for (let n = 1; n <= world.levels; n++) if (done(world.id, n)) completed++;
        const previous = PALABRA_WORLDS[index - 1];
        return (
          <section key={world.id} aria-labelledby={`palabra-mundo-${world.id}`}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 id={`palabra-mundo-${world.id}`} className="font-display text-xl font-extrabold">
                <span className="mr-2 text-margin">{world.id}</span>
                {world.name}
              </h2>
              <span className="text-sm text-muted-foreground tabular-nums">
                {completed}/{world.levels}
              </span>
            </div>
            <p className="mb-3 max-w-prose text-muted-foreground">
              {open || !previous ? world.description : `Completá ${world.unlockAfter} niveles de «${previous.name}» para abrirlo.`}
            </p>
            <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
              {Array.from({ length: world.levels }, (_, i) => {
                const n = i + 1;
                const result = progress.levels[levelKey(world.id, n)];
                const won = hydrated && result?.won;
                const unlocked = hydrated && isLevelUnlocked(world.id, n, done);
                const stars = won ? 4 - result.attempts : 0;
                const cls = cn(
                  "relative grid aspect-square min-h-11 place-items-center rounded-md font-display text-base font-bold tabular-nums transition-colors",
                  won && "border-2 border-ink bg-tile shadow-[0_2px_0_0_var(--shadow-ink)]",
                  !won && unlocked && "border-2 border-dashed border-ink hover:bg-accent",
                  !unlocked && "text-pencil/50",
                );
                return (
                  <li key={n}>
                    {unlocked ? (
                      <Link href={`/palabra/nivel/${world.id}/${n}`} className={cls} aria-label={`Nivel ${n}${won ? `, resuelto en ${result.attempts} intentos` : ""}`}>
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
