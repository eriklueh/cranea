import { cn } from "@/lib/utils";

/** Línea de ejemplo para "Cómo se juega": "#" pintada, "x" cruz, "." vacía, "s" pintada de sugerencia. */
export function ExampleLine({ clue, cells, label }: { clue: string; cells: string; label: string }) {
  return (
    <div className="flex items-center gap-3" role="img" aria-label={label}>
      <span className="w-12 text-right font-display text-lg font-bold tabular-nums">{clue}</span>
      <span className="flex overflow-hidden rounded-sm border-2 border-ink bg-tile">
        {[...cells].map((ch, i) => (
          <span
            key={i}
            className={cn(
              "relative size-9 border-r border-r-ink/15 last:border-r-0",
              ch === "#" && "bg-ink",
              ch === "s" && "bg-clue-present-bg",
            )}
          >
            {ch === "x" && (
              <svg viewBox="0 0 10 10" aria-hidden className="absolute inset-[18%] text-pencil">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            )}
          </span>
        ))}
      </span>
    </div>
  );
}
