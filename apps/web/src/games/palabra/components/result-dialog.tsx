"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ResultShareButton, resultLabel, SHARE_FOOTER } from "@/components/share/result-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PALABRA_WORLDS } from "@cranea/core/palabra";
import { PlusNudge } from "@/components/plus/plus-nudge";
import { plusLevelCount } from "@/lib/free-levels";
import { formatTime } from "@/lib/utils";
import { usePalabra } from "../store";
import { LetterTile } from "./letter-tile";
import { popStep } from "@/lib/motion";
import { WORD_LENGTH } from "@cranea/core/palabra";

/** La palabra entra con `pop` escalonado después del diálogo. */
const SOLUTION_STEP = popStep(WORD_LENGTH);

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
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const total = puzzle.attempts;
  const attempts = won ? misses.length + 1 : total;
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Palabra del día #${mode.number}` : `Nivel ${mode.world}-${mode.level}`;

  // Como Wordle: los colores de cada intento, sin las letras.
  const rows: (0 | 1 | 2)[][] = [...misses.map((m) => m.scores), ...(won ? [[2, 2, 2, 2, 2] as (0 | 1 | 2)[]] : [])];
  const grid = rows.map((r) => r.map((x) => (x === 2 ? "🟩" : x === 1 ? "🟨" : "⬜")).join("")).join("\n");
  const score = won ? `${attempts}/${total}` : `X/${total}`;
  const shareText = `Craneá · ${title} ${score} en ${time}\n${grid}\n${location.origin}/palabra`;
  const card = {
    game: "Palabra",
    label: resultLabel(mode),
    won,
    headline: won ? score : "No salió",
    detail: won ? `${attempts} ${attempts === 1 ? "intento" : "intentos"} · ${time}` : `${score} · ${time}`,
    visual: { kind: "colors" as const, rows },
    footer: SHARE_FOOTER,
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
            <LetterTile key={i} letter={letter} tone="solution" className="anim-pop [--base:var(--dur-base)]" style={{ "--i": i, "--step": SOLUTION_STEP } as CSSProperties} />
          ))}
        </div>
        <DialogFooter>
          <ResultShareButton text={shareText} card={card} filename={`cranea-palabra-${mode.kind === "daily" ? mode.date : `${mode.world}-${mode.level}`}.png`} />
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
        <PlusNudge gameId="palabra" levels={plusLevelCount(PALABRA_WORLDS)} mode={mode} won={won} onLeave={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
