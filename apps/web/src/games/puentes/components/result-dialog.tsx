"use client";
import Link from "next/link";
import { ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORLDS } from "@cranea/core/puentes";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
import { formatTime } from "@/lib/utils";
import { usePuentes } from "../store";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number; /** Repetición del diario: no se guarda ni cuenta para el ranking. */ practice?: boolean };

export const mistakesText = (n: number) => (n === 0 ? "sin errores" : n === 1 ? "con 1 error" : `con ${n} errores`);

export function ResultDialog({ open, onOpenChange, mode }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
}) {
  const { puzzle, status, mistakes, startedAt, finishedAt } = usePuentes();
  if (!puzzle || status !== "won") return null;

  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Puentes del día #${mode.number}` : `Puentes ${mode.world}-${mode.level}`;

  const shareText = `Craneá · ${title}\n🌉 ${mistakesText(mistakes)} en ${time}\n${location.origin}/puentes`;
  // Solo dónde están las islas: sin números ni puentes, no se puede copiar la solución.
  const card = {
    game: "Puentes",
    label: resultLabel(mode),
    won: true,
    headline: mistakes === 0 ? "Sin errores" : mistakes === 1 ? "1 error" : `${mistakes} errores`,
    detail: `${puzzle.islands.length} islas · ${time}`,
    visual: { kind: "board" as const, width: puzzle.width, height: puzzle.height, dots: puzzle.islands.map(({ r, c }) => ({ r, c })) },
    footer: SHARE_FOOTER,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mistakes === 0 ? "Todo conectado, sin errores" : "Todo conectado"}</DialogTitle>
          <DialogDescription>{`${title}, ${mistakesText(mistakes)} y en ${time}.`}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <ResultShareButton text={shareText} card={card} filename={`cranea-puentes-${mode.kind === "daily" ? mode.date : `${mode.world}-${mode.level}`}.png`} />
          {mode.kind === "level" && mode.nextHref ? (
            <Button asChild>
              <Link href={mode.nextHref}>Siguiente nivel</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/puentes">Volver a los mundos</Link>
            </Button>
          )}
        </DialogFooter>
        <PlusNudge gameId="puentes" levels={plusLevelCount(WORLDS)} mode={mode} onLeave={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
