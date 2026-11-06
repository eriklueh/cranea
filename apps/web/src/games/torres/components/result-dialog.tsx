"use client";
import Link from "next/link";
import { attemptMarks, ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORLDS } from "@cranea/core/torres";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
import { useLocale, useT } from "@/lib/i18n";
import { formatTime } from "@/lib/utils";
import { attemptsOf, MAX_ATTEMPTS, useTorres } from "../store";
import { Board } from "./board";

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
  const { puzzle, status, mistakes, startedAt, finishedAt } = useTorres();
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = attemptsOf(status, mistakes);
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? t("torres.dailyTitle", { n: mode.number }) : `Torres ${mode.world}-${mode.level}`;

  const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (i < mistakes ? "🟥" : won && i === mistakes ? "🟩" : "⬜")).join("");
  const score = won ? `${attempts}/${MAX_ATTEMPTS}` : "X";
  const shareText = `Craneá · ${title}\n${t("torres.shareLine", { marks, score, time })}\n${location.origin}/torres`;
  // La cuadrícula vacía de la ciudad: ni pistas ni alturas.
  const card = {
    game: "Torres",
    label: resultLabel(mode, locale),
    won,
    headline: won ? `${attempts}/${MAX_ATTEMPTS}` : t("torres.cardLost"),
    detail: won
      ? `${puzzle.size}×${puzzle.size} · ${mistakes === 0 ? t("torres.cardNoMistakes") : t("common.errors", { count: mistakes })} · ${time}`
      : t("torres.cardUnsolved", { time }),
    visual: { kind: "board" as const, width: puzzle.size, height: puzzle.size },
    marks: attemptMarks(MAX_ATTEMPTS, mistakes, won),
    footer: SHARE_FOOTER,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{won ? (attempts === 1 ? t("torres.resultFlawless") : t("torres.resultWon")) : t("torres.resultLost")}</DialogTitle>
          <DialogDescription>
            {won ? t("torres.resultWonDesc", { title, attempts, max: MAX_ATTEMPTS, time }) : t("torres.resultLostDesc", { title })}
          </DialogDescription>
        </DialogHeader>
        <Board
          size={puzzle.size}
          clues={puzzle.clues}
          givens={puzzle.givens}
          values={puzzle.solution}
          readOnly
          feedback={false}
          wave
          className="max-w-64"
        />
        <DialogFooter>
          <ResultShareButton text={shareText} card={card} filename={`cranea-torres-${mode.kind === "daily" ? mode.date : `${mode.world}-${mode.level}`}.png`} />
          {mode.kind === "level" && !won && (
            <Button variant="outline" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          )}
          {mode.kind === "level" && mode.nextHref ? (
            <Button asChild>
              <Link href={mode.nextHref}>{t("torres.nextLevel")}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/torres">{t("torres.backToWorlds")}</Link>
            </Button>
          )}
        </DialogFooter>
        <PlusNudge gameId="torres" levels={plusLevelCount(WORLDS)} mode={mode} won={won} onLeave={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
