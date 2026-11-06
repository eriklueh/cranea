"use client";

import { LightbulbIcon, LockIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { openPaywall } from "@/components/plus/paywall";
import { cifraStepText } from "@cranea/core/i18n";
import { useLocale, useT } from "@/lib/i18n";
import { FREE_HINTS, addFreeHintStep, freeHintSteps, usePlus } from "@/lib/plus";
import { useCifra } from "../store";
import { hintNudge, nextHintStep, traceFor } from "../hints";

const base = "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Primer toque: qué filas cruzar. Segundo toque: la deducción.
 * Sin Craneá Plus hay `FREE_HINTS` pistas por tablero; volver a ver una ya dada no cuenta. Después, la hoja de Plus.
 */
export function HintButton() {
  const t = useT();
  const status = useCifra((s) => s.status);
  const hint = useCifra((s) => s.hint);
  const id = useCifra((s) => s.puzzle?.id);
  const { plus } = usePlus();
  const [used, setUsed] = useState(0);
  useEffect(() => {
    if (id) setUsed(freeHintSteps(id).length);
  }, [id]);
  if (status !== "playing") return null;
  const out = !plus && used >= FREE_HINTS;

  const ask = () => {
    const s = useCifra.getState();
    if (!s.puzzle || !traceFor(s.puzzle).solved) return;
    const step = nextHintStep(s.puzzle, s.misses, s.marks);
    if (step >= 0 && !plus) {
      const seen = freeHintSteps(s.puzzle.id);
      if (!seen.includes(step)) {
        if (seen.length >= FREE_HINTS) return openPaywall("hints");
        addFreeHintStep(s.puzzle.id, step);
        setUsed(seen.length + 1);
      }
    }
    s.showHint(step);
  };

  const title = hint?.level === 1 ? t("cifra.hintSeeDeduction") : out ? t("cifra.hintMoreWithPlus") : t("cifra.hintAsk");
  return (
    <button type="button" className={base} onClick={ask} aria-pressed={hint !== null} title={title} aria-label={out && hint?.level !== 1 ? t("cifra.hintLockedLabel") : undefined}>
      <LightbulbIcon className="size-4" />
      {t("cifra.hint")}
      {out && hint?.level !== 1 && <LockIcon aria-hidden className="size-3 opacity-60" />}
    </button>
  );
}

/** Filas a resaltar por la pista activa. */
export function useHintRows(): number[] {
  return useCifra((s) => (s.hint && s.puzzle && s.hint.step >= 0 ? traceFor(s.puzzle).steps[s.hint.step]?.rows : undefined)) ?? NONE;
}
const NONE: number[] = [];

export function HintPanel() {
  const t = useT();
  const locale = useLocale();
  const hint = useCifra((s) => s.hint);
  const puzzle = useCifra((s) => s.puzzle);
  const status = useCifra((s) => s.status);
  const showHint = useCifra((s) => s.showHint);
  const closeHint = useCifra((s) => s.closeHint);
  // Al terminar, la pista abierta se queda (sin acciones): si desapareciera, todo lo de abajo saltaría.
  if (!hint || !puzzle) return null;
  const step = hint.step >= 0 ? traceFor(puzzle).steps[hint.step] : null;

  return (
    <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm anim-appear">
      <LightbulbIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-clue-present" />
      <div className="flex-1 space-y-1.5">
        {!step ? (
          <p>{t("cifra.hintAllShown")}</p>
        ) : hint.level === 1 ? (
          <>
            <p>{hintNudge(step, t, locale)}</p>
            <button type="button" className="font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => showHint(hint.step)}>
              {t("cifra.hintWhatFollows")}
            </button>
          </>
        ) : (
          <p>{cifraStepText(step, locale).text}</p>
        )}
      </div>
      <button type="button" className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-ink/5 hover:text-foreground" onClick={closeHint} aria-label={t("cifra.hintClose")}>
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
