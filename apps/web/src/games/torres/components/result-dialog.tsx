"use client";
import Link from "next/link";
import { attemptMarks, ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORLDS } from "@cranea/core/torres";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
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
  const { puzzle, status, mistakes, startedAt, finishedAt } = useTorres();
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = attemptsOf(status, mistakes);
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Torres del día #${mode.number}` : `Torres ${mode.world}-${mode.level}`;

  const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (i < mistakes ? "🟥" : won && i === mistakes ? "🟩" : "⬜")).join("");
  const shareText = `Craneá · ${title}\n${marks} ${won ? `${attempts}/${MAX_ATTEMPTS}` : "X"} en ${time}\n${location.origin}/torres`;
  // La cuadrícula vacía de la ciudad: ni pistas ni alturas.
  const card = {
    game: "Torres",
    label: resultLabel(mode),
    won,
    headline: won ? `${attempts}/${MAX_ATTEMPTS}` : "No salió",
    detail: won ? `${puzzle.size}×${puzzle.size} · ${mistakes === 0 ? "sin errores" : mistakes === 1 ? "1 error" : `${mistakes} errores`} · ${time}` : `Sin resolver · ${time}`,
    visual: { kind: "board" as const, width: puzzle.size, height: puzzle.size },
    marks: attemptMarks(MAX_ATTEMPTS, mistakes, won),
    footer: SHARE_FOOTER,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{won ? (attempts === 1 ? "Sin un solo error" : "Ciudad completa") : "Se acabaron los intentos"}</DialogTitle>
          <DialogDescription>
            {won ? `${title}, en ${attempts} de ${MAX_ATTEMPTS} intentos y ${time}.` : `${title}, sin resolver. Así quedaba la ciudad:`}
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
              Reintentar
            </Button>
          )}
          {mode.kind === "level" && mode.nextHref ? (
            <Button asChild>
              <Link href={mode.nextHref}>Siguiente nivel</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/torres">Volver a los mundos</Link>
            </Button>
          )}
        </DialogFooter>
        <PlusNudge gameId="torres" levels={plusLevelCount(WORLDS)} mode={mode} won={won} onLeave={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
