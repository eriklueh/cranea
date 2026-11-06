"use client";
import Link from "next/link";
import { CheckIcon, ChevronRightIcon, FlameIcon, PartyPopperIcon, XIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { formatCountdown, msToNextDaily } from "@/components/game-home/progress";
import { useClock } from "@/components/game-home/use-clock";
import { ProtectorBadge } from "@/components/protectors";
import { ShareActions, ShareIconButton } from "@/components/share/share-actions";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/progress";
import { craneaStreak, dailiesFor, dayNumber, dayShareCard, dayShareText, CRANEA_LAUNCH, shortDate, type DailyEntry } from "./dailies";

const host = () => location.host;

/**
 * "Los diarios de hoy" arriba del inicio: cuáles faltan, un botón al siguiente y,
 * con los cinco hechos, compartir el día. Depende de la fecha del dispositivo y de
 * localStorage: hasta montar muestra un esqueleto del mismo alto.
 */
export function TodayHub() {
  const now = useClock(30_000);
  const games = useProgress((s) => s.games);
  const t = useT();
  const locale = useLocale();

  if (now === null) {
    return <div aria-hidden className="h-[184px] rounded-xl border-2 border-border bg-card motion-safe:animate-pulse" />;
  }

  const today = todayKey(new Date(now));
  const entries = dailiesFor(games, today, locale);
  const done = entries.filter((e) => e.result).length;
  const total = entries.length;
  const next = entries.find((e) => !e.result);
  const streak = craneaStreak(games, today, locale);
  const number = dayNumber(today, CRANEA_LAUNCH);

  return (
    <section
      aria-labelledby="hoy-titulo"
      className={cn(
        "rounded-xl border-2 border-ink bg-card p-3.5 shadow-[0_4px_0_0_var(--shadow-ink)] sm:p-4",
        !next && "bg-clue-exact-bg/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="hoy-titulo" className="flex items-center gap-1.5 font-display text-xl leading-tight font-extrabold">
            {next ? (
              t("hub.todayTitle")
            ) : (
              <>
                <PartyPopperIcon aria-hidden className="size-5 text-ok anim-pop" />
                {t("hub.allDone", { count: total })}
              </>
            )}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground tabular-nums">
            <span>
              #{number} · {shortDate(today, locale)}
            </span>
            {streak > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-0.5" title={t("hub.craneaStreakTitle", { count: total })}>
                  <FlameIcon aria-hidden className="size-3.5 text-clue-present" />
                  {t("hub.craneaStreak", { streak })}
                  <span className="sr-only">{t("hub.craneaStreakSr", { streak, count: total })}</span>
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <ProtectorBadge compact />
          </p>
        </div>
        <p className="shrink-0 font-display text-2xl leading-none font-extrabold tabular-nums" aria-label={t("hub.doneOf", { done, total })}>
          {done}
          <span className="text-base text-muted-foreground">/{total}</span>
        </p>
      </div>

      <ol
        className="-mx-1.5 mt-3 grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, total)}, minmax(0, 1fr))` }}
        aria-label={t("hub.dailyStatus")}
      >
        {entries.map((e) => (
          <li key={e.id}>
            <Chip entry={e} next={e.id === next?.id} />
          </li>
        ))}
      </ol>

      {next ? (
        <div className="mt-3 flex gap-2">
          <Link
            href={next.href}
            className="group flex h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg bg-primary pr-3 pl-4 text-primary-foreground shadow-[0_2px_0_0_var(--shadow-ink)] outline-none transition-transform hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-px"
          >
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-xs font-semibold opacity-75">{done === 0 ? t("hub.startWith") : t("hub.nextDaily")}</span>
              <span className="truncate font-display text-lg font-extrabold">{next.name}</span>
            </span>
            <ChevronRightIcon aria-hidden className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
          {done > 0 && <ShareIconButton label={t("hub.shareSoFar")} text={() => dayShareText(entries, today, host(), locale)} />}
        </div>
      ) : (
        <div className="mt-3">
          <ShareActions
            label={t("hub.shareDay")}
            text={() => dayShareText(entries, today, host(), locale)}
            card={() => dayShareCard(entries, today, streak, host(), locale)}
            filename={`cranea-${today}.png`}
          />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("hub.nextOnesIn")} <span className="font-semibold text-foreground tabular-nums">{formatCountdown(msToNextDaily(now), locale)}</span>
          </p>
        </div>
      )}
    </section>
  );
}

function Chip({ entry, next }: { entry: DailyEntry; next: boolean }) {
  const r = entry.result;
  const t = useT();
  const state = !r ? (next ? t("hub.chipNext") : t("hub.unplayed")) : r.won ? t("hub.solved") : t("hub.missed");
  return (
    <Link
      href={entry.href}
      aria-label={`${entry.name}: ${state}`}
      className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg py-1 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span
        aria-hidden
        className={cn(
          "grid size-7 place-items-center rounded-full",
          !r && "border-2 border-dashed",
          !r && (next ? "border-ink" : "border-border"),
          r?.won && "bg-ok text-card",
          r && !r.won && "bg-margin text-card",
        )}
      >
        {r?.won && <CheckIcon className="size-4" strokeWidth={3} />}
        {r && !r.won && <XIcon className="size-4" strokeWidth={3} />}
      </span>
      <span aria-hidden className={cn("w-full truncate text-center font-display text-[10.5px] leading-tight font-bold tracking-tight min-[400px]:text-xs", !r && !next && "text-muted-foreground")}>
        {entry.name}
      </span>
    </Link>
  );
}
