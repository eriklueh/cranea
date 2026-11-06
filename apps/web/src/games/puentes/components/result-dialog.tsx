"use client";
import Link from "next/link";
import { ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORLDS } from "@cranea/core/puentes";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
import { useLocale, useT, type T } from "@/lib/i18n";
import { formatTime } from "@/lib/utils";
import { usePuentes } from "../store";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number; /** Repetición del diario: no se guarda ni cuenta para el ranking. */ practice?: boolean };

/** "sin errores", "con 1 error", "con 2 errores". */
export const mistakesText = (n: number, t: T) => (n === 0 ? t("puentes.mistakesNone") : t("puentes.mistakesText", { count: n }));
/** "Sin errores", "1 error", "2 errores". */
export const mistakesCount = (n: number, t: T) => (n === 0 ? t("puentes.noMistakes") : t("common.errors", { count: n }));

export function ResultDialog({ open, onOpenChange, mode }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
}) {
  const t = useT();
  const locale = useLocale();
  const { puzzle, status, mistakes, startedAt, finishedAt } = usePuentes();
  if (!puzzle || status !== "won") return null;

  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? t("puentes.dailyTitle", { n: mode.number }) : t("puentes.levelTitle", { world: mode.world, level: mode.level });

  const shareText = `Craneá · ${title}\n🌉 ${t("puentes.shareText", { mistakes: mistakesText(mistakes, t), time })}\n${location.origin}/puentes`;
  // Solo dónde están las islas: sin números ni puentes, no se puede copiar la solución.
  const card = {
    game: "Puentes",
    label: resultLabel(mode, locale),
    won: true,
    headline: mistakesCount(mistakes, t),
    detail: `${t("puentes.islands", { count: puzzle.islands.length })} · ${time}`,
    visual: { kind: "board" as const, width: puzzle.width, height: puzzle.height, dots: puzzle.islands.map(({ r, c }) => ({ r, c })) },
    footer: SHARE_FOOTER,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mistakes === 0 ? t("puentes.allLinkedNoMistakes") : t("puentes.allLinked")}</DialogTitle>
          <DialogDescription>{t("puentes.resultDescription", { title, mistakes: mistakesText(mistakes, t), time })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <ResultShareButton text={shareText} card={card} filename={`cranea-puentes-${mode.kind === "daily" ? mode.date : `${mode.world}-${mode.level}`}.png`} />
          {mode.kind === "level" && mode.nextHref ? (
            <Button asChild>
              <Link href={mode.nextHref}>{t("puentes.nextLevel")}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/puentes">{t("puentes.backToWorlds")}</Link>
            </Button>
          )}
        </DialogFooter>
        <PlusNudge gameId="puentes" levels={plusLevelCount(WORLDS)} mode={mode} onLeave={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
