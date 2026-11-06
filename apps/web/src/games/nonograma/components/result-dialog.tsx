"use client";
import Link from "next/link";
import { attemptMarks, ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORLDS } from "@cranea/core/nonograma";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
import { pictureTitle } from "@cranea/core/i18n";
import { useLocale, useT } from "@/lib/i18n";
import { formatTime } from "@/lib/utils";
import { attemptsOf, MAX_ATTEMPTS, useNonograma } from "../store";
import { hintsUsedText } from "../hint-copy";
import { PixelArt, solutionRows } from "./pixel-art";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number; /** Repetición del diario: no se guarda ni cuenta para el ranking. */ practice?: boolean };

export function ResultDialog({ open, onOpenChange, mode, onRetry }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
  onRetry: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const { puzzle, status, checks, startedAt, finishedAt, hintsUsed } = useNonograma();
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = attemptsOf({ status, checks });
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const name = pictureTitle(puzzle.title, locale);
  const title = mode.kind === "daily" ? t("nonograma.dailyTitle", { n: mode.number }) : `Nonograma ${mode.world}-${mode.level}`;
  const picture = mode.kind === "daily" ? t("nonograma.pictureDaily") : t("nonograma.pictureLevel", { title: name });

  const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (won && i === attempts - 1 ? "🟩" : i < attempts - 1 || !won ? "🟥" : "⬜")).join("");
  const score = won ? `${attempts}/${MAX_ATTEMPTS}` : "X";
  const shareText = `Craneá · ${title}\n${t("nonograma.shareLine", { marks, score, time })}\n${location.origin}/nonograma`;
  // La silueta del tablero, sin una sola casilla pintada: el dibujo no se revela.
  const card = {
    game: "Nonograma",
    label: resultLabel(mode, locale),
    won,
    headline: won ? `${attempts}/${MAX_ATTEMPTS}` : t("nonograma.cardLost"),
    detail: won
      ? `${puzzle.width}×${puzzle.height} · ${attempts === 1 ? t("nonograma.cardNoChecks") : t("common.attempts", { count: attempts })} · ${time}`
      : t("nonograma.cardUnsolved", { time }),
    visual: { kind: "board" as const, width: puzzle.width, height: puzzle.height, blocks: 5 },
    marks: attemptMarks(MAX_ATTEMPTS, won ? attempts - 1 : MAX_ATTEMPTS, won),
    footer: SHARE_FOOTER,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{won ? (attempts === 1 ? t("nonograma.resultFlawless") : t("nonograma.resultWon")) : t("nonograma.resultLost")}</DialogTitle>
          <DialogDescription>
            {won ? t("nonograma.resultWonDesc", { title, picture, attempts, max: MAX_ATTEMPTS, time }) : t("nonograma.resultLostDesc", { title, picture })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <div className="anim-pop rounded-md border-2 border-ink bg-tile p-2 shadow-[0_3px_0_0_var(--shadow-ink)] [--base:var(--dur-base)]">
            <PixelArt rows={solutionRows(puzzle.solution, puzzle.width)} className="size-20" label={name} />
          </div>
          <div className="space-y-1">
            {mode.kind === "level" && <p className="font-display text-2xl font-extrabold">{name}</p>}
            {hintsUsed > 0 && <p className="text-sm text-muted-foreground">{hintsUsedText(hintsUsed, locale)}</p>}
          </div>
        </div>
        <DialogFooter>
          <ResultShareButton text={shareText} card={card} filename={`cranea-nonograma-${mode.kind === "daily" ? mode.date : `${mode.world}-${mode.level}`}.png`} />
          {mode.kind === "level" && (!won || attempts > 1) && (
            <Button variant="outline" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          )}
          {mode.kind === "level" && mode.nextHref ? (
            <Button asChild>
              <Link href={mode.nextHref}>{t("nonograma.nextLevel")}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/nonograma">{t("nonograma.backToWorlds")}</Link>
            </Button>
          )}
        </DialogFooter>
        <PlusNudge gameId="nonograma" levels={plusLevelCount(WORLDS)} mode={mode} won={won} onLeave={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
