import type { LetterScore } from "@cranea/core/palabra";
import { LetterTile, toneFor } from "./letter-tile";

const WORD = "pista";
const SCORES: LetterScore[] = [2, 0, 1, 0, 2];

/** Arte de la tarjeta en el inicio. */
export function PalabraPreview() {
  return (
    <span className="flex gap-1.5" aria-hidden>
      {[...WORD].map((letter, i) => (
        <LetterTile key={i} letter={letter} tone={toneFor(SCORES[i])} size="sm" />
      ))}
    </span>
  );
}
