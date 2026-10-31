"use client";

import { LightbulbIcon, XIcon } from "lucide-react";
import { useCifra } from "../store";
import { hintNudge, nextHintStep, traceFor } from "../hints";

const base = "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

/** Primer toque: qué filas cruzar. Segundo toque: la deducción. */
export function HintButton() {
  const status = useCifra((s) => s.status);
  const hint = useCifra((s) => s.hint);
  if (status !== "playing") return null;

  const ask = () => {
    const s = useCifra.getState();
    if (!s.puzzle || !traceFor(s.puzzle).solved) return;
    s.showHint(nextHintStep(s.puzzle, s.misses, s.marks));
  };

  return (
    <button type="button" className={base} onClick={ask} aria-pressed={hint !== null} title={hint?.level === 1 ? "Ver la deducción" : "Pedir una pista"}>
      <LightbulbIcon className="size-4" />
      Pista
    </button>
  );
}

/** Filas a resaltar por la pista activa. */
export function useHintRows(): number[] {
  return useCifra((s) => (s.hint && s.puzzle && s.hint.step >= 0 ? traceFor(s.puzzle).steps[s.hint.step]?.rows : undefined)) ?? NONE;
}
const NONE: number[] = [];

export function HintPanel() {
  const hint = useCifra((s) => s.hint);
  const puzzle = useCifra((s) => s.puzzle);
  const status = useCifra((s) => s.status);
  const showHint = useCifra((s) => s.showHint);
  const closeHint = useCifra((s) => s.closeHint);
  if (!hint || !puzzle || status !== "playing") return null;
  const step = hint.step >= 0 ? traceFor(puzzle).steps[hint.step] : null;

  return (
    <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">
      <LightbulbIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-clue-present" />
      <div className="flex-1 space-y-1.5">
        {!step ? (
          <p>Tus marcas ya muestran todo lo que se puede deducir. Escribí el código.</p>
        ) : hint.level === 1 ? (
          <>
            <p>{hintNudge(step)}</p>
            <button type="button" className="font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => showHint(hint.step)}>
              ¿Qué se deduce?
            </button>
          </>
        ) : (
          <p>{step.text}</p>
        )}
      </div>
      <button type="button" className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-ink/5 hover:text-foreground" onClick={closeHint} aria-label="Cerrar pista">
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
