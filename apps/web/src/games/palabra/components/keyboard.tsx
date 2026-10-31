"use client";
import { useMemo } from "react";
import { DeleteIcon } from "lucide-react";
import { keyboardStates, WORD_LENGTH, type KeyState } from "@cranea/core/palabra";
import { cn } from "@/lib/utils";
import { usePalabra } from "../store";
import { LetterTile, SCORE_LABEL } from "./letter-tile";

const ROWS = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"];

export function InputSlots() {
  const input = usePalabra((s) => s.input);
  const shakeKey = usePalabra((s) => s.shakeKey);
  const message = usePalabra((s) => s.message);
  return (
    <div className="flex flex-col items-center gap-2">
      <div key={shakeKey} className={cn("flex gap-1.5", shakeKey > 0 && "animate-shake")} role="img" aria-label={`Tu palabra: ${input.join("").toUpperCase() || "vacía"}`}>
        {Array.from({ length: WORD_LENGTH }, (_, i) =>
          input[i] === undefined ? <LetterTile key={i} tone="empty" /> : <LetterTile key={`${i}-${input[i]}`} letter={input[i]} tone="input" />,
        )}
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function keyClass(state: KeyState | undefined) {
  if (state === 2) return "border-clue-exact bg-clue-exact text-paper";
  if (state === 1) return "border-clue-present bg-clue-present-bg text-clue-present";
  if (state === 0) return "border-pencil/30 bg-muted text-pencil/70 shadow-none";
  return "border-ink bg-tile";
}

/** Teclado en pantalla (QWERTY español, con Ñ). Cada tecla muestra lo que ya dicen las filas a la vista. */
export function Keyboard({ ready, onSubmit }: { ready: boolean; onSubmit: () => void }) {
  const puzzle = usePalabra((s) => s.puzzle);
  const misses = usePalabra((s) => s.misses);
  const input = usePalabra((s) => s.input);
  const status = usePalabra((s) => s.status);
  const press = usePalabra((s) => s.press);
  const backspace = usePalabra((s) => s.backspace);
  const states = useMemo(() => keyboardStates([...(puzzle?.clues ?? []), ...misses]), [puzzle, misses]);
  const playing = status === "playing";
  const full = input.length === WORD_LENGTH;
  const base =
    "inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-md border-2 font-display text-lg font-bold uppercase shadow-[0_2px_0_0_var(--shadow-ink)] transition-transform outline-none active:translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40";

  return (
    <div className="space-y-1.5" role="group" aria-label="Teclado">
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
                className={cn(base, keyClass(state))}
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
