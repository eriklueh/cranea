"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WORLDS } from "@cranea/core/cifra";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
import { formatTime } from "@/lib/utils";
import { MAX_ATTEMPTS, useCifra } from "../store";
import { traceFor } from "../hints";
import { CelebrationBanner, type Celebration } from "./celebration";
import { DigitTile } from "./digit-tile";
import { Walkthrough } from "./walkthrough";

export type GameMode =
  | { kind: "level"; world: number; level: number; nextHref: string | null }
  | { kind: "daily"; date: string; number: number; /** Repetición del diario: no se guarda ni cuenta para el ranking. */ practice?: boolean };

export function ResultDialog({ open, onOpenChange, mode, onRetry, celebration }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: GameMode;
  onRetry: () => void;
  celebration?: Celebration | null;
}) {
  const { puzzle, status, misses, elapsed, hintsUsed } = useCifra();
  const [copied, setCopied] = useState(false);
  const [explaining, setExplaining] = useState(false);
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = won ? misses.length + 1 : MAX_ATTEMPTS;
  const time = formatTime(elapsed);
  const change = (o: boolean) => {
    if (!o) setExplaining(false);
    onOpenChange(o);
  };
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
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        {explaining ? <Walkthrough puzzle={puzzle} onBack={() => setExplaining(false)} /> : <>
        {won && celebration && <CelebrationBanner celebration={celebration} />}
        <DialogHeader>
          <DialogTitle>{won ? (attempts === 1 ? "Al primer intento" : "Código descifrado") : "Se acabaron los intentos"}</DialogTitle>
          <DialogDescription>
            {won ? `${title}, en ${attempts} de ${MAX_ATTEMPTS} intentos y ${time}.` : `${title}, sin resolver. Este era el código:`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5" aria-label="Solución">
          {puzzle.solution.map((d, i) => (
            <DigitTile key={i} digit={d} tone="solution" className="anim-pop-in [--base:140ms]" style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          {traceFor(puzzle).solved && (
            <button type="button" className="font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setExplaining(true)}>
              ¿Cómo se resolvía?
            </button>
          )}
          {hintsUsed > 0 && <span className="text-muted-foreground">{hintsUsed === 1 ? "Usaste 1 pista" : `Usaste ${hintsUsed} pistas`}</span>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={share}>
            {copied ? "Copiado" : "Compartir resultado"}
          </Button>
          {mode.kind === "daily" && (
            <Button variant="outline" asChild>
              <Link href={`/ranking?juego=cifra&fecha=${mode.date}`}>Ver ranking</Link>
            </Button>
          )}
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
        <PlusNudge gameId="cifra" levels={plusLevelCount(WORLDS)} mode={mode} won={won} onLeave={() => change(false)} />
        </>}
      </DialogContent>
    </Dialog>
  );
}
