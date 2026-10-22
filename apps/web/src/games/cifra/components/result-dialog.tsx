"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";
import { MAX_ATTEMPTS, useCifra } from "../store";
import { DigitTile } from "./digit-tile";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number };

export function ResultDialog({ open, onOpenChange, mode, onRetry }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
  onRetry: () => void;
}) {
  const { puzzle, status, misses, startedAt, finishedAt } = useCifra();
  const [copied, setCopied] = useState(false);
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = won ? misses.length + 1 : MAX_ATTEMPTS;
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Cifra del día #${mode.number}` : `Nivel ${mode.world}-${mode.level}`;

  const share = async () => {
    const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (i < misses.length ? "🟥" : won && i === misses.length ? "🟩" : "⬜")).join("");
    const text = `Craneá · ${title}\n${marks} ${won ? `${attempts}/${MAX_ATTEMPTS}` : "X"} en ${time}\n${location.origin}/cifra`;
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
          <DialogTitle>{won ? (attempts === 1 ? "Al primer intento" : "Código descifrado") : "Se acabaron los intentos"}</DialogTitle>
          <DialogDescription>
            {won ? `${title}, en ${attempts} de ${MAX_ATTEMPTS} intentos y ${time}.` : `${title}, sin resolver. Este era el código:`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5" aria-label="Solución">
          {puzzle.solution.map((d, i) => (
            <DigitTile key={i} digit={d} tone="solution" />
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
              <Link href="/cifra">Volver a los mundos</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
