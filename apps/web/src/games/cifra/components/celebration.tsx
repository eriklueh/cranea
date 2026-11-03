"use client";

import type { CSSProperties } from "react";
import { FlameIcon, TrophyIcon } from "lucide-react";
import { DURATION, popStep } from "@/lib/motion";
import type { Result } from "@/stores/progress";
import { formatTime } from "@/lib/utils";
import { getWorld, levelKey } from "../data";

export type Celebration =
  | { kind: "world"; name: string; levels: number; timeMs: number; attempts: number }
  | { kind: "streak"; days: number };

export const STREAK_MILESTONES = [7, 30];

/** Resumen del mundo si ya ganaste todos sus niveles. */
export function worldCelebration(levels: Record<string, Result>, worldId: number): Celebration | null {
  const world = getWorld(worldId);
  if (!world) return null;
  const results: Result[] = [];
  for (let n = 1; n <= world.levels; n++) {
    const r = levels[levelKey(worldId, n)];
    if (!r?.won) return null;
    results.push(r);
  }
  return {
    kind: "world",
    name: world.name,
    levels: results.length,
    timeMs: results.reduce((t, r) => t + r.timeMs, 0),
    attempts: results.reduce((t, r) => t + r.attempts, 0) / results.length,
  };
}

// Chispas alrededor del ícono (`pop` escalonado, ≤ 600 ms); con movimiento reducido quedan quietas.
const SPARKS = ["left-[18%] top-3", "right-[20%] top-5", "left-[28%] bottom-4", "right-[26%] bottom-3", "left-[10%] top-1/2", "right-[12%] top-1/2"];
const SPARK_STYLE = (i: number) => ({ "--base": `${DURATION.base}ms`, "--i": i, "--step": popStep(SPARKS.length) }) as CSSProperties;

export function CelebrationBanner({ celebration }: { celebration: Celebration }) {
  const world = celebration.kind === "world";
  return (
    <div className="relative overflow-hidden rounded-xl bg-clue-exact-bg px-4 pt-5 pb-4 text-center text-clue-exact anim-appear">
      {SPARKS.map((c, i) => (
        <span key={i} aria-hidden className={`anim-pop absolute size-1.5 rounded-full bg-current opacity-60 ${c}`} style={SPARK_STYLE(i)} />
      ))}
      <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-card shadow-[0_2px_0_0_var(--clue-exact)] anim-pop [--base:var(--dur-fast)]">
        {world ? <TrophyIcon className="size-5" /> : <FlameIcon className="size-5" />}
      </span>
      {celebration.kind === "world" ? (
        <>
          <p className="font-display text-lg font-bold">Mundo completo: {celebration.name}</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-foreground">
            <div>
              <dt className="text-xs text-muted-foreground">Niveles</dt>
              <dd className="font-semibold tabular-nums">{celebration.levels}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tiempo total</dt>
              <dd className="font-semibold tabular-nums">{formatTime(celebration.timeMs)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Intentos promedio</dt>
              <dd className="font-semibold tabular-nums">{celebration.attempts.toLocaleString("es-AR", { maximumFractionDigits: 1 })}</dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          <p className="font-display text-lg font-bold">{celebration.days === 7 ? "Una semana entera" : celebration.days === 30 ? "Un mes entero" : `${celebration.days} días`}</p>
          <p className="text-sm text-foreground">Resolviste el diario {celebration.days} días seguidos.</p>
        </>
      )}
    </div>
  );
}
