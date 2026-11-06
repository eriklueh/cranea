"use client";

import { LightbulbIcon, LockIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { hintFor, hintKey, type LineKind } from "@cranea/core/nonograma";
import { openPaywall } from "@/components/plus/paywall";
import { FREE_HINTS, addFreeHintStep, freeHintSteps, usePlus } from "@/lib/plus";
import { HINT_COPY, hintExplain, hintNudge, techniqueName } from "../hint-copy";
import { useNonograma } from "../store";

const base = "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Como en Cifra: primer toque, qué línea mirar; segundo, la deducción. Nunca pinta ni cruza.
 * Sin Craneá Plus hay `FREE_HINTS` pistas por tablero (`cranea-pistas:<id>`); volver a pedir la misma
 * (misma línea) no cuenta, ni el aviso de que no queda nada. Después, la hoja de Plus.
 */
export function HintButton() {
  const status = useNonograma((s) => s.status);
  const hint = useNonograma((s) => s.hint);
  const id = useNonograma((s) => s.puzzle?.id);
  const { plus } = usePlus();
  const [used, setUsed] = useState(0);
  useEffect(() => {
    if (id) setUsed(freeHintSteps(id).length);
  }, [id]);
  if (status !== "playing") return null;
  const out = !plus && used >= FREE_HINTS;

  const ask = () => {
    const s = useNonograma.getState();
    if (!s.puzzle || s.stroke) return;
    const info = hintFor(s.puzzle, s.board);
    const key = hintKey(info);
    if (key !== -1 && !plus) {
      const seen = freeHintSteps(s.puzzle.id);
      if (!seen.includes(key)) {
        if (seen.length >= FREE_HINTS) return openPaywall("hints");
        addFreeHintStep(s.puzzle.id, key);
        setUsed(seen.length + 1);
      }
    }
    s.showHint(info);
  };

  const title = hint?.level === 1 ? HINT_COPY.explain : out ? HINT_COPY.locked : HINT_COPY.ask;
  return (
    <button type="button" className={base} onClick={ask} aria-pressed={hint !== null} title={title} aria-label={out && hint?.level !== 1 ? HINT_COPY.lockedLabel : undefined}>
      <LightbulbIcon className="size-4" />
      {HINT_COPY.button}
      {out && hint?.level !== 1 && <LockIcon aria-hidden className="size-3 opacity-60" />}
    </button>
  );
}

/** Fila o columna que señala la pista abierta. */
export function useHintLine(): { line: LineKind; index: number } | null {
  return useNonograma((s) => {
    const info = s.hint?.info;
    if (!info || info.kind === "done") return null;
    return info.kind === "mistake" ? info : info.step;
  });
}

export function HintPanel() {
  const hint = useNonograma((s) => s.hint);
  const status = useNonograma((s) => s.status);
  const showHint = useNonograma((s) => s.showHint);
  const closeHint = useNonograma((s) => s.closeHint);
  // Al terminar, la pista abierta se queda (sin acciones): si desapareciera, lo de abajo saltaría.
  if (!hint) return null;
  const { info, level } = hint;
  const playing = status === "playing";

  return (
    <div role="status" className="mx-2 mt-1 mb-2 flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm anim-appear">
      <LightbulbIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-clue-present" />
      <div className="flex-1 space-y-1.5">
        {level === 1 || info.kind === "done" ? (
          <>
            <p>{hintNudge(info)}</p>
            {info.kind !== "done" && playing && (
              <button type="button" className="min-h-8 font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => showHint(info)}>
                {HINT_COPY.why}
              </button>
            )}
          </>
        ) : (
          <>
            {info.kind === "step" && <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{techniqueName(info.step)}</p>}
            <p key="explain" className="anim-fade">{hintExplain(info)}</p>
          </>
        )}
      </div>
      <button type="button" className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-ink/5 hover:text-foreground" onClick={closeHint} aria-label={HINT_COPY.close}>
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
