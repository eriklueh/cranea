"use client";
import type { CSSProperties } from "react";
import { DeleteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptic, useOnChange } from "@/lib/motion";
import { useCifra } from "../store";
import { DigitTile } from "./digit-tile";

export function InputSlots() {
  const puzzle = useCifra((s) => s.puzzle);
  const input = useCifra((s) => s.input);
  const shakeKey = useCifra((s) => s.shakeKey);
  const won = useCifra((s) => s.status === "won");
  useOnChange(shakeKey, (key) => key > 0 && haptic("invalid"));
  useOnChange(won, (w) => w && haptic("win"));
  if (!puzzle) return null;
  return (
    <div key={shakeKey} className={cn("flex gap-1.5", shakeKey > 0 && "animate-shake")} aria-live="polite">
      {Array.from({ length: puzzle.length }, (_, i) =>
        input[i] === undefined ? (
          <DigitTile key={i} tone="empty" />
        ) : (
          // Al descifrar el código, las fichas saltan una por una.
          <DigitTile key={`${i}-${input[i]}`} digit={input[i]} tone={won ? "solution" : "input"} className={won ? "anim-hop" : undefined} style={{ "--i": i } as CSSProperties} />
        ),
      )}
    </div>
  );
}

export function Keypad() {
  const { puzzle, input, status, press, backspace, submit } = useCifra();
  const playing = status === "playing";
  const full = puzzle ? input.length === puzzle.length : false;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 10 }, (_, d) => (
          <button
            key={d}
            type="button"
            disabled={!playing || input.includes(d) || full}
            onClick={() => press(d)}
            className={cn(
              "h-12 rounded-md border-2 border-ink bg-tile font-display text-xl font-bold tabular-nums shadow-[0_2px_0_0_var(--shadow-ink)] transition-[translate,scale,opacity] duration-100 outline-none active:translate-y-px active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-35",
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-1.5">
        <Button variant="outline" size="lg" onClick={backspace} disabled={!playing || input.length === 0}>
          <DeleteIcon /> Borrar
        </Button>
        <Button size="lg" onClick={submit} disabled={!playing || !full}>
          Probar código
        </Button>
      </div>
    </div>
  );
}
