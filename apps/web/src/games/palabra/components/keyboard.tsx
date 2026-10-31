"use client";
import { useMemo } from "react";
import { DeleteIcon } from "lucide-react";
import { keyboardStates, WORD_LENGTH, type KeyState } from "@cranea/core/palabra";
import { cn } from "@/lib/utils";
import { usePalabra } from "../store";
import { SCORE_LABEL } from "./letter-tile";

const ROWS = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"];

function keyClass(state: KeyState | undefined) {
  if (state === 2) return "border-clue-exact bg-clue-exact text-paper";
  if (state === 1) return "border-clue-present bg-clue-present-bg text-clue-present";
  if (state === 0) return "border-pencil/30 bg-muted text-pencil/70 shadow-none";
  return "border-ink bg-tile";
}

/** Teclado en pantalla (QWERTY español, con Ñ). Cada tecla muestra lo que ya dijeron tus intentos, cuando la fila termina de darse vuelta. */
export function Keyboard({ ready, onSubmit }: { ready: boolean; onSubmit: () => void }) {
  const misses = usePalabra((s) => s.misses);
  const input = usePalabra((s) => s.input);
  const status = usePalabra((s) => s.status);
  const press = usePalabra((s) => s.press);
  const backspace = usePalabra((s) => s.backspace);
  const states = useMemo(() => keyboardStates(misses), [misses]);
  const playing = status === "playing";
  const full = input.length === WORD_LENGTH;
  const base =
    "inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-md border-2 font-display text-lg font-bold uppercase shadow-[0_2px_0_0_var(--shadow-ink)] [transition:translate_90ms,scale_90ms,background-color_260ms_ease_var(--key-delay,0ms),border-color_260ms_ease_var(--key-delay,0ms),color_260ms_ease_var(--key-delay,0ms)] outline-none active:translate-y-px active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40";

  return (
    <div className="space-y-1.5" role="group" aria-label="Teclado" data-tutorial="keyboard">
      {ROWS.map((row, r) => (
        <div key={row} className="flex gap-1">
          {r === 2 && (
            <button
              type="button"
              className={cn(base, "flex-[1.7] border-ink bg-primary text-sm normal-case text-primary-foreground")}
              onClick={onSubmit}
              disabled={!playing || !full || !ready}
              aria-label={ready ? "Probar palabra" : "Cargando palabras"}
            >
              {ready ? "Probar" : "…"}
            </button>
          )}
          {[...row].map((letter) => {
            const state = states[letter];
            return (
              <button
                key={letter}
                type="button"
                disabled={!playing || full}
                onClick={() => press(letter)}
                className={cn(base, keyClass(state), "[--key-delay:600ms]")}
                aria-label={`${letter.toUpperCase()}${state !== undefined && state !== "unknown" ? `, ${SCORE_LABEL[state]}` : ""}`}
              >
                {letter}
              </button>
            );
          })}
          {r === 2 && (
            <button type="button" className={cn(base, "flex-[1.7] border-ink bg-tile")} onClick={backspace} disabled={!playing || input.length === 0} aria-label="Borrar letra">
              <DeleteIcon className="size-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
