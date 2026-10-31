import { ScoreSymbol } from "./letter-tile";

export function ScoreLegend() {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 text-clue-exact">
        <ScoreSymbol score={2} /> en su lugar
      </span>
      <span className="inline-flex items-center gap-1.5 text-clue-present">
        <ScoreSymbol score={1} /> está, en otro lugar
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-pencil/30" /> no está
      </span>
    </p>
  );
}
