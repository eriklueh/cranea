"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";
import { usePalabra } from "../store";
import { LetterTile } from "./letter-tile";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number; /** Repetición del diario: no se guarda ni cuenta para el ranking. */ practice?: boolean };

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
  const total = puzzle.attempts;
  const attempts = won ? misses.length + 1 : total;
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Palabra del día #${mode.number}` : `Nivel ${mode.world}-${mode.level}`;

  const share = async () => {
    // Como Wordle: los colores de cada intento, sin las letras.
    const rows = [...misses.map((m) => m.scores), ...(won ? [[2, 2, 2, 2, 2]] : [])];
    const grid = rows.map((r) => r.map((x) => (x === 2 ? "🟩" : x === 1 ? "🟨" : "⬜")).join("")).join("\n");
    const text = `Craneá · ${title} ${won ? `${attempts}/${total}` : `X/${total}`} en ${time}\n${grid}\n${location.origin}/palabra`;
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
            {won ? `${title}, en ${attempts} de ${total} intentos y ${time}.` : `${title}, sin resolver. La palabra era «${puzzle.display}».`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5" role="img" aria-label={`Respuesta: ${puzzle.display}`}>
          {[...puzzle.answer].map((letter, i) => (
            <LetterTile key={i} letter={letter} tone="solution" className="anim-pop-in [--base:140ms]" style={{ "--i": i } as CSSProperties} />
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
