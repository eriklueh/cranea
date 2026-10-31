"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameProgress } from "@/stores/progress";
import { doneFor, wonIn } from "./progress";
import { plural, type GameHomeConfig } from "./types";

/**
 * Mundos como pestañas y la grilla de niveles del mundo elegido: en el celular entra
 * un mundo por pantalla en vez de cien botones seguidos.
 */
export function WorldMap({
  config,
  progress,
  hydrated,
  initialWorld,
  nextKey,
}: {
  config: GameHomeConfig;
  progress: GameProgress;
  hydrated: boolean;
  /** Mundo a mostrar primero (el de "Seguir jugando"). */
  initialWorld: number;
  /** Nivel resaltado como el próximo, `w-l`. */
  nextKey: string | null;
}) {
  const { worlds } = config;
  const [picked, setPicked] = useState<number | null>(null);
  const selectedId = picked ?? initialWorld;
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const done = hydrated ? doneFor(config, progress) : () => false;
  const unit = config.unit ?? { one: "nivel", many: "niveles" };
  const idBase = `${config.id}-mundo`;

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = worlds.length - 1;
    const to = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null) return;
    e.preventDefault();
    setPicked(worlds[to].id);
    tabs.current[to]?.focus();
  };

  const index = Math.max(0, worlds.findIndex((w) => w.id === selectedId));
  const world = worlds[index];
  const open = hydrated && config.isWorldUnlocked(world.id, done);
  const won = wonIn(world, done);
  const previous = worlds[index - 1];
  const missing = previous ? Math.max(0, world.unlockAfter - wonIn(previous, done)) : 0;

  return (
    <section aria-labelledby={`${idBase}s`}>
      <h2 id={`${idBase}s`} className="mb-2 font-display text-xl font-extrabold">Mundos</h2>

      <div role="tablist" aria-label="Mundos" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${worlds.length}, minmax(0, 1fr))` }}>
        {worlds.map((w, i) => {
          const selected = w.id === world.id;
          const wOpen = hydrated && config.isWorldUnlocked(w.id, done);
          const wWon = wonIn(w, done);
          return (
            <button
              key={w.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${idBase}-tab-${w.id}`}
              aria-selected={selected}
              aria-controls={`${idBase}-panel`}
              tabIndex={selected ? 0 : -1}
              aria-label={`Mundo ${i + 1}: ${w.name}. ${hydrated ? (wOpen ? `${wWon} de ${w.levels}` : "bloqueado") : ""}`}
              onClick={() => setPicked(w.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border-2 px-1 pt-1.5 pb-2 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected ? "border-ink bg-ink text-paper shadow-[0_3px_0_0_var(--shadow-ink)]" : "border-border bg-card hover:border-ink",
              )}
            >
              <span className="flex items-center gap-1 font-display text-lg leading-none font-extrabold">
                {i + 1}
                {hydrated && !wOpen && <LockIcon aria-hidden className="size-3.5 opacity-70" />}
              </span>
              <span className={cn("hidden max-w-full truncate text-xs font-semibold sm:block", !selected && "text-muted-foreground")}>{w.name}</span>
              <span aria-hidden className={cn("h-1 w-4/5 overflow-hidden rounded-full", selected ? "bg-paper/25" : "bg-muted")}>
                <span className={cn("block h-full rounded-full", selected ? "bg-paper" : "bg-ok")} style={{ width: `${(wWon / w.levels) * 100}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${world.id}`} className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-extrabold">
            <span className="mr-1.5 text-margin">{index + 1}</span>
            {world.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
            {hydrated ? won : "–"}/{world.levels}
          </span>
        </div>
        <p className="mt-0.5 mb-3 text-sm text-muted-foreground">
          {!hydrated || open ? (
            world.description
          ) : (
            <span className="inline-flex items-start gap-1.5">
              <LockIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Se abre con {plural(world.unlockAfter, unit.one, unit.many)} de «{previous?.name}».{" "}
                <span className="font-semibold text-foreground">Te {missing === 1 ? "falta" : "faltan"} {missing}.</span>
              </span>
            </span>
          )}
        </p>

        <ol className={cn("grid grid-cols-6 gap-2 sm:grid-cols-10", hydrated && !open && "opacity-60")}>
          {Array.from({ length: world.levels }, (_, i) => (
            <LevelCell key={i} config={config} progress={progress} hydrated={hydrated} worldId={world.id} n={i + 1} done={done} next={nextKey === `${world.id}-${i + 1}`} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function LevelCell({
  config,
  progress,
  hydrated,
  worldId,
  n,
  done,
  next,
}: {
  config: GameHomeConfig;
  progress: GameProgress;
  hydrated: boolean;
  worldId: number;
  n: number;
  done: (w: number, l: number) => boolean;
  next: boolean;
}) {
  const result = hydrated ? progress.levels[config.levelKey(worldId, n)] : undefined;
  const won = Boolean(result?.won);
  const tried = Boolean(result && !result.won);
  const unlocked = hydrated && config.isLevelUnlocked(worldId, n, done);
  const thumb = won ? config.thumbnail?.(worldId, n) : null;
  const stars = won ? config.stars(result!) : 0;

  const cls = cn(
    "relative grid aspect-square min-h-11 w-full place-items-center rounded-md font-display text-base font-bold tabular-nums outline-none transition-[background-color,transform] focus-visible:ring-[3px] focus-visible:ring-ring/50",
    !hydrated && "bg-muted/60 text-transparent",
    won && "border-2 border-ink bg-tile shadow-[0_2px_0_0_var(--shadow-ink)] hover:-translate-y-px",
    next && "bg-ink text-paper shadow-[0_3px_0_0_var(--shadow-ink)] ring-2 ring-ink ring-offset-2 ring-offset-paper hover:-translate-y-px",
    tried && !next && "border-2 border-margin text-margin hover:bg-accent",
    !won && !tried && !next && unlocked && "border-2 border-dashed border-ink hover:bg-accent",
    hydrated && !unlocked && "text-pencil/45",
  );

  if (!unlocked) {
    return (
      <li>
        <span className={cls} aria-label={hydrated ? `Nivel ${n}, bloqueado` : `Nivel ${n}`}>
          {n}
        </span>
      </li>
    );
  }

  const title = won ? config.levelTitle?.(worldId, n) : "";
  const label = `Nivel ${n}${title ? `, ${title}` : ""}${won ? `, resuelto ${config.resultText(result!)}` : tried ? ", sin resolver" : ""}${next ? ", el próximo" : ""}`;
  return (
    <li>
      <Link href={config.levelHref(worldId, n)} className={cls} aria-label={label} aria-current={next ? "step" : undefined}>
        {thumb ?? n}
        {won && (
          <span aria-hidden className="absolute bottom-0.5 flex gap-0.5">
            {Array.from({ length: 3 }, (_, k) => (
              <span key={k} className={cn("size-1.5 rounded-full", k < stars ? "bg-ok" : "bg-border")} />
            ))}
          </span>
        )}
      </Link>
    </li>
  );
}
