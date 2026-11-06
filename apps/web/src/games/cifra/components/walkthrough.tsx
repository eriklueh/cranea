"use client";

import { useState } from "react";
import { codeToString, type CifraPuzzle } from "@cranea/core/cifra";
import { cifraStepText } from "@cranea/core/i18n";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { traceFor } from "../hints";
import { ClueRow } from "./clue-row";

/** "¿Cómo se resolvía?": la traza del solver, paso a paso, con las filas que intervienen. */
export function Walkthrough({ puzzle, onBack }: { puzzle: CifraPuzzle; onBack: () => void }) {
  const t = useT();
  const locale = useLocale();
  const { steps } = traceFor(puzzle);
  const [i, setI] = useState(0);
  const total = steps.length + 1;
  const step = steps[i];
  const rows = step?.rows ?? [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("cifra.howWasItSolved")}</DialogTitle>
        <DialogDescription>{t("cifra.stepOf", { step: i + 1, total })}</DialogDescription>
      </DialogHeader>
      <ol className="space-y-2" aria-label={t("cifra.cluesLabel")}>
        {puzzle.clues.map((c, r) => (
          <ClueRow key={r} clue={c} size="sm" highlight={rows.includes(r)} dim={step !== undefined && !rows.includes(r)} />
        ))}
      </ol>
      <p key={i} aria-live="polite" className="min-h-18 text-sm leading-relaxed anim-fade">
        {step ? cifraStepText(step, locale).text : t("cifra.onlyCodeLeft", { code: codeToString(puzzle.solution) })}
      </p>
      <DialogFooter>
        <Button variant="ghost" onClick={onBack}>{t("common.back")}</Button>
        <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}>{t("cifra.previous")}</Button>
        <Button disabled={i === total - 1} onClick={() => setI(i + 1)}>{t("common.next")}</Button>
      </DialogFooter>
    </>
  );
}
