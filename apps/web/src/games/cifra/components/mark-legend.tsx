import { DigitTile } from "./digit-tile";

export function MarkLegend() {
  return (
    <div className="space-y-2 text-center text-sm text-muted-foreground">
      <p>Tocá una cifra del tablero: una vez la descartás, dos va, tres va ahí.</p>
      <div className="flex items-center justify-center gap-4">
        {([
          ["out", "descartada"],
          ["in", "va"],
          ["here", "va ahí"],
        ] as const).map(([mark, label]) => (
          <span key={mark} className="inline-flex items-center gap-1.5">
            <span aria-hidden><DigitTile digit={5} mark={mark} size="sm" className="size-8 text-base" /></span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
