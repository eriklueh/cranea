import type { Clue } from "@cranea/core/palabra";
import { cn } from "@/lib/utils";
import { LetterTile, SCORE_LABEL, toneFor } from "./letter-tile";

interface Props {
  clue: Clue;
  miss?: boolean;
  size?: "sm" | "md";
}

export function describeRow(clue: Clue) {
  return [...clue.word].map((letter, i) => `${letter.toUpperCase()} ${SCORE_LABEL[clue.scores[i]]}`).join(", ");
}

export function WordRow({ clue, miss, size = "md" }: Props) {
  return (
    <li className="flex justify-center">
      <span className="sr-only">{`${miss ? "Tu intento" : "Pista"}: ${clue.word.toUpperCase()}. ${describeRow(clue)}.`}</span>
      <span aria-hidden className={cn("relative flex gap-1.5", miss && "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-margin")}>
        {[...clue.word].map((letter, i) => (
          <LetterTile key={i} letter={letter} tone={toneFor(clue.scores[i])} size={size} />
        ))}
      </span>
    </li>
  );
}
