import { cn } from "@/lib/utils";

/** Arte chico para la tarjeta de inicio: una fila de torres con sus dos pistas. */
const ROW = [2, 1, 4, 3];

export function TorresPreview({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-2", className)} aria-hidden>
      <Clue value={2} />
      <span className="flex items-end gap-1.5">
        {ROW.map((h, i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <span
              className="w-8 rounded-t-md border-2 border-b-0 border-ink bg-tile shadow-[inset_0_-3px_0_0_var(--grid-line)]"
              style={{ height: `${h * 0.6 + 0.4}rem` }}
            />
            <span className="grid size-8 place-items-center rounded-md border-2 border-ink bg-tile font-display text-lg font-bold tabular-nums shadow-[0_2px_0_0_var(--shadow-ink)]">
              {h}
            </span>
          </span>
        ))}
      </span>
      <Clue value={2} />
    </div>
  );
}

function Clue({ value }: { value: number }) {
  return (
    <span className="mb-1 grid size-7 place-items-center rounded-full bg-clue-exact-bg font-display text-base font-bold text-clue-exact tabular-nums">{value}</span>
  );
}
