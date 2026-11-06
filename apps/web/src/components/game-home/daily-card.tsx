"use client";
import Link from "next/link";
import { CheckIcon, FlameIcon, MoonIcon, PlayIcon, TrophyIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { ProtectorBadge } from "@/components/protectors";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n";
import { cn, formatTime } from "@/lib/utils";
import { dailyStreak, type GameProgress } from "@/stores/progress";
import { formatCountdown, msToNextDaily } from "./progress";
import { localized, type GameHomeConfig } from "./types";

/**
 * El desafío de hoy. Sin jugar es la acción principal de la pantalla; una vez jugado
 * se achica a una fila de resultado para que el próximo paso sea seguir con los niveles.
 */
export function DailyCard({ config, progress, now }: { config: GameHomeConfig; progress: GameProgress; now: number | null }) {
  const { daily, article } = config;
  const today = now === null ? null : todayKey(new Date(now));
  const headingId = `${config.id}-diario`;
  const t = useT();
  const locale = useLocale();

  if (today === null) {
    return (
      <section aria-labelledby={headingId} aria-busy className="rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)]">
        <h2 id={headingId} className="font-display text-2xl font-extrabold">{t("hub.todayChallenge")}</h2>
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
            {t("hub.todayChallenge")} <span className="text-base font-bold text-muted-foreground tabular-nums">#{number}</span>
          </h2>
          {streak > 0 && (
            <span className="mt-1 flex shrink-0 items-center gap-1">
              <Streak days={streak} />
              <ProtectorBadge />
            </span>
          )}
        </div>
        <p className="mt-0.5 text-muted-foreground">
          {resume ? t("hub.inProgress") : streak > 0 ? t("hub.keepStreak") : localized(daily.blurb, locale)}
        </p>
        <Button asChild size="lg" className="mt-4 h-12 w-full text-lg sm:w-auto sm:min-w-48">
          <Link href={daily.href}>
            <PlayIcon aria-hidden className="size-4 fill-current" />
            {resume ? t("hub.resume") : t("common.play")}
          </Link>
        </Button>
      </section>
    );
  }

  const won = played.won;
  const fem = article === "la";
  const result = config.resultText(played, locale);
  // "en " / "in ": a la vista queda solo el dato; el lector de pantalla lee la frase entera.
  const inPrefix = t("hub.inAttempts", { text: "" });
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
            {t("hub.todayChallenge")} <span className="font-normal text-muted-foreground tabular-nums">#{number}</span>
          </h2>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            {won ? (
              <span className="text-foreground">
                {/* El tilde ya dice que salió: a la vista queda el dato ("1 intento", "sin errores"). */}
                <span className="sr-only">{t("hub.solvedSr", { fem: fem ? 1 : 0 })} {result.startsWith(inPrefix) && inPrefix}</span>
                {result.startsWith(inPrefix) ? result.slice(inPrefix.length) : result}
              </span>
            ) : (
              <span className="text-foreground">{t("hub.badgeMissed")}</span>
            )}
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              <span className="sr-only">{t("hub.timeSr")}</span>
              {formatTime(played.timeMs)}
            </span>
            {streak > 0 && (
              <>
                <span aria-hidden>·</span>
                <Streak days={streak} compact />
                <ProtectorBadge compact />
              </>
            )}
          </p>
        </div>
        <Button asChild variant="ghost" className="h-11 shrink-0 px-2.5">
          <Link href={`/ranking?juego=${config.id}`}>
            <TrophyIcon aria-hidden className="text-clue-present" />
            {t("common.ranking")}
          </Link>
        </Button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 border-t border-dashed border-border pt-1 pl-12 text-sm text-muted-foreground">
        <p>
          {t("hub.nextIn", { fem: fem ? 1 : 0 })}{" "}
          <span className="font-semibold text-foreground tabular-nums">{formatCountdown(msToNextDaily(now!), locale)}</span>
        </p>
        <Link
          href={daily.href}
          className="-my-1 inline-flex min-h-11 shrink-0 items-center rounded-md px-2.5 font-semibold underline decoration-border decoration-2 underline-offset-4 outline-none hover:text-foreground hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t("hub.replay")}
        </Link>
      </div>
    </section>
  );
}

function Streak({ days, compact, className }: { days: number; compact?: boolean; className?: string }) {
  const t = useT();
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
      <span className="sr-only">{t("hub.streakSr", { count: days })}</span>
    </span>
  );
}
