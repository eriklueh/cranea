"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [copied, setCopied] = useState(false);
  if (!puzzle || status !== "won") return null;

  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Puentes del día #${mode.number}` : `Puentes ${mode.world}-${mode.level}`;

  const share = async () => {
    const text = `Craneá · ${title}\n🌉 ${mistakesText(mistakes)} en ${time}\n${location.origin}/puentes`;
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
          <DialogTitle>{mistakes === 0 ? "Todo conectado, sin errores" : "Todo conectado"}</DialogTitle>
          <DialogDescription>{`${title}, ${mistakesText(mistakes)} y en ${time}.`}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={share}>
            {copied ? "Copiado" : "Compartir resultado"}
          </Button>
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
      </DialogContent>
    </Dialog>
  );
}
