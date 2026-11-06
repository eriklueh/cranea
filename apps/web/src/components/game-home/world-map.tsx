"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { LockIcon } from "lucide-react";
import { PlusBadge, openPaywall } from "@/components/plus/paywall";
import { FREE_LEVELS, isFreeLevel } from "@/lib/free-levels";
import { worldCopy } from "@cranea/core/i18n";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { GameProgress } from "@/stores/progress";
import { doneFor, wonIn } from "./progress";
import { localized, plural, type GameHomeConfig } from "./types";

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
  aside,
  needsPlus = false,
}: {
  config: GameHomeConfig;
  progress: GameProgress;
  hydrated: boolean;
  /** Mundo a mostrar primero (el de "Seguir jugando"). */
  initialWorld: number;
  /** Nivel resaltado como el próximo, `w-l`. */
  nextKey: string | null;
  /** Al lado del título de la sección (el enlace a "Cómo se juega"). */
  aside?: React.ReactNode;
  /** Sin Craneá Plus: los niveles que no son gratis abren la hoja de Plus en vez de jugarse. */
  needsPlus?: boolean;
}) {
  const { worlds } = config;
  const [picked, setPicked] = useState<number | null>(null);
  const selectedId = picked ?? initialWorld;
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const done = hydrated ? doneFor(config, progress) : () => false;
  const t = useT();
  const locale = useLocale();
  const unit = config.unit
    ? { one: localized(config.unit.one, locale), many: localized(config.unit.many, locale) }
    : { one: t("hub.unitOne"), many: t("hub.unitMany") };
  const worldName = (w: { id: number; name: string; description: string }) => worldCopy(config.id, w, locale).name;
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
  // Sin Plus, un mundo sin niveles gratis se explica con Plus, no con la regla de niveles.
  const paidWorld = needsPlus && !isFreeLevel(worlds, world.id, 1);

  return (
    <section aria-labelledby={`${idBase}s`}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id={`${idBase}s`} className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("common.levels")}</h2>
          {needsPlus && <PlusBadge />}
        </div>
        {aside}
      </div>

      <div
        role="tablist"
        aria-label={t("hub.worlds")}
        className="grid gap-1 rounded-xl bg-muted p-1"
        style={{ gridTemplateColumns: `repeat(${worlds.length}, minmax(0, 1fr))` }}
      >
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
              aria-label={t("hub.worldTab", { n: i + 1, name: worldName(w), state: hydrated ? (wOpen ? t("hub.wonOf", { won: wWon, total: w.levels }) : t("hub.locked")) : "" })}
              onClick={() => setPicked(w.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 pt-1.5 pb-1.5 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected ? "bg-card shadow-[0_1px_0_1px_var(--border)] dark:bg-accent" : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-1 font-display text-base leading-none font-extrabold">
                {i + 1}
                {hydrated && !wOpen && <LockIcon aria-hidden className="size-3 opacity-70" />}
              </span>
              <span aria-hidden className="h-1 w-3/5 overflow-hidden rounded-full bg-border/70">
                <span className="block h-full rounded-full bg-ok" style={{ width: `${(wWon / w.levels) * 100}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${world.id}`} className="mt-3">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 truncate font-display text-lg font-extrabold">
            {worldName(world)}
          </h3>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{hydrated ? won : "–"}</span>/{world.levels}
          </span>
        </div>
        {hydrated && needsPlus && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-clue-present-bg px-3 py-1 text-sm text-clue-present">
            <span className="min-w-0 flex-1 py-1">{paidWorld ? t("hub.paidWorld") : t("hub.freeFirst", { count: FREE_LEVELS, unit: unit.many })}</span>
            <button type="button" onClick={() => openPaywall("levels")} aria-haspopup="dialog" className="-mr-1 inline-flex min-h-11 shrink-0 items-center rounded-md px-1 font-semibold underline decoration-2 underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              {t("hub.seePlus")}
            </button>
          </p>
        )}
        {hydrated && !open && !paidWorld && (
          <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <LockIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {t("hub.unlockRule", { need: plural(world.unlockAfter, unit.one, unit.many), world: previous ? worldName(previous) : "" })}{" "}
              <span className="font-semibold text-foreground">{t("hub.missing", { count: missing })}</span>
            </span>
          </p>
        )}

        <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 sm:gap-2">
          {Array.from({ length: world.levels }, (_, i) => (
            <LevelCell key={i} config={config} progress={progress} hydrated={hydrated} worldId={world.id} n={i + 1} done={done} next={nextKey === `${world.id}-${i + 1}`} needsPlus={needsPlus} />
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
  needsPlus,
}: {
  config: GameHomeConfig;
  progress: GameProgress;
  hydrated: boolean;
  worldId: number;
  n: number;
  done: (w: number, l: number) => boolean;
  next: boolean;
  needsPlus: boolean;
}) {
  const result = hydrated ? progress.levels[config.levelKey(worldId, n)] : undefined;
  const won = Boolean(result?.won);
  const tried = Boolean(result && !result.won);
  const unlocked = hydrated && config.isLevelUnlocked(worldId, n, done);
  const thumb = won ? config.thumbnail?.(worldId, n) : null;
  const stars = won ? config.stars(result!) : 0;
  const paid = needsPlus && !isFreeLevel(config.worlds, worldId, n);
  const t = useT();
  const locale = useLocale();

  const cls = cn(
    "relative grid aspect-square min-h-11 w-full place-items-center rounded-md font-display text-base font-bold tabular-nums outline-none transition-[background-color,transform] focus-visible:ring-[3px] focus-visible:ring-ring/50",
    !hydrated && "bg-muted/60 text-transparent",
    won && "border-2 border-ink bg-tile hover:-translate-y-px",
    next && "bg-ink text-paper shadow-[0_3px_0_0_var(--shadow-ink)] hover:-translate-y-px",
    tried && !next && "border-2 border-margin text-margin hover:bg-accent",
    !won && !tried && !next && unlocked && "border-2 border-border bg-card hover:border-ink",
    hydrated && !unlocked && "text-sm font-semibold text-pencil/40",
  );

  if (!unlocked && !(paid && hydrated)) {
    return (
      <li>
        <span className={cls} aria-label={hydrated ? t("hub.levelLocked", { n }) : t("common.level", { n })}>
          {n}
        </span>
      </li>
    );
  }

  const title = won ? config.levelTitle?.(worldId, n, locale) : "";
  const label = `${t("common.level", { n })}${title ? `, ${title}` : ""}${won ? t("hub.levelSolved", { result: config.resultText(result!, locale) }) : tried ? t("hub.levelUnsolved") : ""}${next ? t("hub.levelNext") : ""}`;
  const content = (
    <>
      {thumb ?? n}
      {won && (
        <span aria-hidden className="absolute bottom-0.5 flex gap-0.5">
          {Array.from({ length: 3 }, (_, k) => (
            <span key={k} className={cn("size-1.5 rounded-full", k < stars ? "bg-ok" : "bg-border")} />
          ))}
        </span>
      )}
    </>
  );
  if (paid) {
    return (
      <li>
        <button type="button" onClick={() => openPaywall("levels")} className={cls} aria-label={`${label}${t("hub.withPlus")}`} aria-haspopup="dialog">
          {content}
          <span aria-hidden className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full border border-border bg-card text-muted-foreground">
            <LockIcon className="size-2.5" strokeWidth={2.75} />
          </span>
        </button>
      </li>
    );
  }
  return (
    <li>
      <Link href={config.levelHref(worldId, n)} className={cls} aria-label={label} aria-current={next ? "step" : undefined}>
        {content}
      </Link>
    </li>
  );
}
