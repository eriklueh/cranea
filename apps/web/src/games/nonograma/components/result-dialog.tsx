"use client";
import Link from "next/link";
import { attemptMarks, ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";
import { attemptsOf, MAX_ATTEMPTS, useNonograma } from "../store";
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
  const { puzzle, status, checks, startedAt, finishedAt } = useNonograma();
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = attemptsOf({ status, checks });
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Nonograma del día #${mode.number}` : `Nonograma ${mode.world}-${mode.level}`;
  const picture = mode.kind === "daily" ? "el dibujo del día" : `«${puzzle.title}»`;

  const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (won && i === attempts - 1 ? "🟩" : i < attempts - 1 || !won ? "🟥" : "⬜")).join("");
  const shareText = `Craneá · ${title}\n${marks} ${won ? `${attempts}/${MAX_ATTEMPTS}` : "X"} en ${time}\n${location.origin}/nonograma`;
  // La silueta del tablero, sin una sola casilla pintada: el dibujo no se revela.
  const card = {
    game: "Nonograma",
    label: resultLabel(mode),
    won,
    headline: won ? `${attempts}/${MAX_ATTEMPTS}` : "No salió",
    detail: won ? `${puzzle.width}×${puzzle.height} · ${attempts === 1 ? "sin revisar" : `${attempts} intentos`} · ${time}` : `Sin resolver · ${time}`,
    visual: { kind: "board" as const, width: puzzle.width, height: puzzle.height, blocks: 5 },
    marks: attemptMarks(MAX_ATTEMPTS, won ? attempts - 1 : MAX_ATTEMPTS, won),
    footer: SHARE_FOOTER,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{won ? (attempts === 1 ? "Sin revisar ni una vez" : "Dibujo completo") : "Esta vez no salió"}</DialogTitle>
          <DialogDescription>
            {won ? `${title}: ${picture}, en ${attempts} de ${MAX_ATTEMPTS} intentos y ${time}.` : `${title}, sin resolver. Era ${picture}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <div className="anim-pop-in rounded-md border-2 border-ink bg-tile p-2 shadow-[0_3px_0_0_var(--shadow-ink)] [--base:120ms]">
            <PixelArt rows={solutionRows(puzzle.solution, puzzle.width)} className="size-20" label={puzzle.title} />
          </div>
          {mode.kind === "level" && <p className="font-display text-2xl font-extrabold">{puzzle.title}</p>}
        </div>
        <DialogFooter>
          <ResultShareButton text={shareText} card={card} filename={`cranea-nonograma-${mode.kind === "daily" ? mode.date : `${mode.world}-${mode.level}`}.png`} />
          {mode.kind === "level" && (!won || attempts > 1) && (
            <Button variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          )}
          {mode.kind === "level" && mode.nextHref ? (
            <Button asChild>
              <Link href={mode.nextHref}>Siguiente nivel</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/nonograma">Volver a los mundos</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
