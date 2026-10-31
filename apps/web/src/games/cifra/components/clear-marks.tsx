"use client";

import { EraserIcon, Undo2Icon } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCifra } from "../store";

const UNDO_MS = 5000;

/** Borra todas las marcas del tablero, con unos segundos para deshacerlo. */
export function ClearMarks({ className }: { className?: string }) {
  const count = useCifra((s) => Object.keys(s.marks).length);
  const cleared = useCifra((s) => s.clearedMarks);
  const status = useCifra((s) => s.status);
  const clearMarks = useCifra((s) => s.clearMarks);
  const restoreMarks = useCifra((s) => s.restoreMarks);
  const forget = useCifra((s) => s.forgetClearedMarks);

  useEffect(() => {
    if (!cleared) return;
    const t = setTimeout(forget, UNDO_MS);
    return () => clearTimeout(t);
  }, [cleared, forget]);

  if (status !== "playing" || (!cleared && count === 0)) return null;

  const base = cn("inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2", className);

  if (cleared) {
    return (
      <button type="button" className={cn(base, "bg-ink/10")} onClick={restoreMarks} title="Recuperar las marcas borradas">
        <Undo2Icon className="size-4" />
        Deshacer
        <span role="status" className="sr-only">Marcas borradas</span>
      </button>
    );
  }

  return (
    <button type="button" className={base} onClick={clearMarks} title="Quitar todas las marcas de las cifras" aria-label={`Limpiar marcas (${count})`}>
      <EraserIcon className="size-4" />
      Limpiar<span className="max-sm:hidden"> marcas</span>
      <span aria-hidden className="rounded-full bg-ink/10 px-1.5 text-xs tabular-nums">{count}</span>
    </button>
  );
}
