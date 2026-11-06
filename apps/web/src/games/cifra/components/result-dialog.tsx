"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { attemptMarks, ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORLDS } from "@cranea/core/cifra";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
import { useLocale, useT } from "@/lib/i18n";
import { formatTime } from "@/lib/utils";
import { MAX_ATTEMPTS, useCifra } from "../store";
import { traceFor } from "../hints";
import { CelebrationBanner, type Celebration } from "./celebration";
import { DigitTile } from "./digit-tile";
import { Walkthrough } from "./walkthrough";
import { displayWorld } from "../data";
import { popStep } from "@/lib/motion";

/** La solución entra con `pop` escalonado después del diálogo (hasta 7 cifras, ≤ 600 ms). */
const SOLUTION_STEP = popStep(7);

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number; /** Repetición del diario: no se guarda ni cuenta para el ranking. */ practice?: boolean };

export function ResultDialog({ open, onOpenChange, mode, onRetry, celebration }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
  onRetry: () => void;
  celebration?: Celebration | null;
}) {
  const t = useT();
  const locale = useLocale();
  const { puzzle, status, misses, elapsed, hintsUsed } = useCifra();
  const [explaining, setExplaining] = useState(false);
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = won ? misses.length + 1 : MAX_ATTEMPTS;
  const time = formatTime(elapsed);
  const change = (o: boolean) => {
    if (!o) setExplaining(false);
    onOpenChange(o);
  };
  const title = mode.kind === "daily" ? t("cifra.dailyTitle", { n: mode.number }) : t("cifra.levelTitle", { world: displayWorld(mode.world), level: mode.level });

  const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (i < misses.length ? "🟥" : won && i === misses.length ? "🟩" : "⬜")).join("");
  const shareText = `Craneá · ${title}\n${t("cifra.shareText", { marks, score: won ? `${attempts}/${MAX_ATTEMPTS}` : "X", time })}\n${location.origin}/cifra`;
  const card = {
    game: "Cifra",
    label: resultLabel(mode.kind === "level" ? { ...mode, world: displayWorld(mode.world) } : mode, locale),
    won,
    headline: won ? `${attempts}/${MAX_ATTEMPTS}` : t("cifra.cardLost"),
    detail: won ? `${t("cifra.cardTries", { count: attempts })} · ${time}` : `${t("cifra.cardUnsolved")} · ${time}`,
    marks: attemptMarks(MAX_ATTEMPTS, misses.length, won),
    footer: SHARE_FOOTER,
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        {explaining ? <Walkthrough puzzle={puzzle} onBack={() => setExplaining(false)} /> : <>
        {won && celebration && <CelebrationBanner celebration={celebration} />}
        <DialogHeader>
          <DialogTitle>{won ? (attempts === 1 ? t("cifra.firstTry") : t("cifra.cracked")) : t("cifra.outOfTries")}</DialogTitle>
          <DialogDescription>
            {won ? t("cifra.wonDescription", { title, attempts, max: MAX_ATTEMPTS, time }) : t("cifra.lostDescription", { title })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5" aria-label={t("cifra.solution")}>
          {puzzle.solution.map((d, i) => (
            <DigitTile key={i} digit={d} tone="solution" className="anim-pop [--base:var(--dur-base)]" style={{ "--i": i, "--step": SOLUTION_STEP } as CSSProperties} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          {traceFor(puzzle).solved && (
            <button type="button" className="font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setExplaining(true)}>
              {t("cifra.howWasItSolved")}
            </button>
          )}
          {hintsUsed > 0 && <span className="text-muted-foreground">{t("cifra.hintsUsed", { count: hintsUsed })}</span>}
        </div>
        <DialogFooter>
          <ResultShareButton text={shareText} card={card} filename={`cranea-cifra-${mode.kind === "daily" ? mode.date : `${mode.world}-${mode.level}`}.png`} />
          {mode.kind === "daily" && (
            <Button variant="outline" asChild>
              <Link href={`/ranking?juego=cifra&fecha=${mode.date}`}>{t("cifra.seeRanking")}</Link>
            </Button>
          )}
          {mode.kind === "level" && !won && (
            <Button variant="outline" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          )}
          {mode.kind === "level" && mode.nextHref ? (
            <Button asChild>
              <Link href={mode.nextHref}>{t("cifra.nextLevel")}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/cifra">{t("cifra.backToWorlds")}</Link>
            </Button>
          )}
        </DialogFooter>
        <PlusNudge gameId="cifra" levels={plusLevelCount(WORLDS)} mode={mode} won={won} onLeave={() => change(false)} />
        </>}
      </DialogContent>
    </Dialog>
  );
}
