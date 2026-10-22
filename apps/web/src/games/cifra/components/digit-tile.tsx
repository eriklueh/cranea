import { cn } from "@/lib/utils";
import type { TileMark } from "@cranea/core/cifra";

const MARK_LABEL: Record<TileMark, string> = { none: "sin marcar", out: "descartada", in: "va", here: "va ahí" };

interface Props {
  digit?: number;
  mark?: TileMark;
  position?: number;
  interactive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  tone?: "clue" | "input" | "empty" | "solution";
  className?: string;
}

/** Ficha de 2×2 cuadritos. En el tablero permite anotar la deducción del jugador. */
export function DigitTile({ digit, mark = "none", position = 0, interactive = false, disabled = false, onClick, size = "md", tone = "clue", className }: Props) {
  const Tile = interactive ? "button" : "span";
  return (
    <Tile
      type={interactive ? "button" : undefined}
      disabled={interactive ? disabled : undefined}
      onClick={interactive ? onClick : undefined}
      data-clue-tile={interactive ? "" : undefined}
      aria-label={interactive ? `Cifra ${digit}, posición ${position + 1}: ${MARK_LABEL[mark]}.${disabled ? "" : " Tocá para cambiar."}` : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-md font-display font-bold tabular-nums select-none",
        size === "md" ? "size-12 text-[1.65rem]" : "size-10 text-xl",
        tone === "empty"
          ? "border-2 border-dashed border-pencil/50 bg-transparent"
          : "border-2 border-ink bg-tile shadow-[0_2px_0_0_var(--shadow-ink)]",
        tone === "input" && "animate-pop",
        tone === "solution" && "border-ok text-ok shadow-[0_2px_0_0_var(--ok)]",
        mark === "out" && "text-pencil/60",
        mark === "here" && "border-ok bg-ok text-paper shadow-[0_2px_0_0_var(--ok)]",
        interactive && "min-h-11 min-w-11 cursor-pointer transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-default",
        interactive && (mark === "here" ? "enabled:hover:bg-ok/90" : "enabled:hover:bg-accent"),
        className,
      )}
    >
      {digit ?? ""}
      {mark === "out" && (
        <span aria-hidden className="absolute inset-x-2 top-1/2 h-0.5 -rotate-12 rounded bg-margin" />
      )}
      {mark === "in" && <span aria-hidden className="absolute inset-1.5 rounded-full border-2 border-clue-present" />}
    </Tile>
  );
}
