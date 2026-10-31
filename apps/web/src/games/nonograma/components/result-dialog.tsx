"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";
import { attemptsOf, MAX_ATTEMPTS, useNonograma } from "../store";
import { PixelArt, solutionRows } from "./pixel-art";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number };

export function ResultDialog({ open, onOpenChange, mode, onRetry }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
  onRetry: () => void;
}) {
  const { puzzle, status, checks, startedAt, finishedAt } = useNonograma();
  const [copied, setCopied] = useState(false);
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = attemptsOf({ status, checks });
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Nonograma del día #${mode.number}` : `Nonograma ${mode.world}-${mode.level}`;
  const picture = mode.kind === "daily" ? "el dibujo del día" : `«${puzzle.title}»`;

  const share = async () => {
    const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (won && i === attempts - 1 ? "🟩" : i < attempts - 1 || !won ? "🟥" : "⬜")).join("");
    const text = `Craneá · ${title}\n${marks} ${won ? `${attempts}/${MAX_ATTEMPTS}` : "X"} en ${time}\n${location.origin}/nonograma`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* el usuario canceló */
    }
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
          <div className="rounded-md border-2 border-ink bg-tile p-2 shadow-[0_3px_0_0_var(--shadow-ink)]">
            <PixelArt rows={solutionRows(puzzle.solution, puzzle.width)} className="size-20" label={puzzle.title} />
          </div>
          {mode.kind === "level" && <p className="font-display text-2xl font-extrabold">{puzzle.title}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={share}>
            {copied ? "Copiado" : "Compartir resultado"}
          </Button>
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
