"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";
import { MAX_ATTEMPTS, usePalabra } from "../store";
import { LetterTile } from "./letter-tile";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number };

export function ResultDialog({ open, onOpenChange, mode, onRetry }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
  onRetry: () => void;
}) {
  const puzzle = usePalabra((s) => s.puzzle);
  const status = usePalabra((s) => s.status);
  const misses = usePalabra((s) => s.misses);
  const startedAt = usePalabra((s) => s.startedAt);
  const finishedAt = usePalabra((s) => s.finishedAt);
  const [copied, setCopied] = useState(false);
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = won ? misses.length + 1 : MAX_ATTEMPTS;
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Palabra del día #${mode.number}` : `Nivel ${mode.world}-${mode.level}`;

  const share = async () => {
    const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (i < misses.length ? "🟥" : won && i === misses.length ? "🟩" : "⬜")).join("");
    const text = `Craneá · ${title}\n${marks} ${won ? `${attempts}/${MAX_ATTEMPTS}` : "X"} en ${time}\n${location.origin}/palabra`;
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
          <DialogTitle>{won ? (attempts === 1 ? "Al primer intento" : "La encontraste") : "Se acabaron los intentos"}</DialogTitle>
          <DialogDescription>
            {won ? `${title}, en ${attempts} de ${MAX_ATTEMPTS} intentos y ${time}.` : `${title}, sin resolver. La palabra era «${puzzle.display}».`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5" role="img" aria-label={`Respuesta: ${puzzle.display}`}>
          {[...puzzle.answer].map((letter, i) => (
            <LetterTile key={i} letter={letter} tone="solution" />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={share}>
            {copied ? "Copiado" : "Compartir resultado"}
          </Button>
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
              <Link href="/palabra">Volver a los mundos</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
