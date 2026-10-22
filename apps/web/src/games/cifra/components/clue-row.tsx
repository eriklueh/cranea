import { tileMarkState, type Clue, type Marks } from "@cranea/core/cifra";
import { cn } from "@/lib/utils";
import { DigitTile } from "./digit-tile";
import { Indicator } from "./pegs";

interface Props {
  clue: Clue;
  marks?: Marks;
  row?: number;
  interactive?: boolean;
  disabled?: boolean;
  onCycleMark?: (row: number, position: number) => void;
  miss?: boolean;
  size?: "sm" | "md";
}

export function ClueRow({ clue, marks, row = 0, miss, size = "md", interactive = false, disabled = false, onCycleMark }: Props) {
  return (
    <li className="flex items-center justify-center gap-2">
      <Indicator kind="exact" value={clue.feedback.exact} />
      <span className={cn("relative flex shrink-0 gap-1.5", miss && "after:absolute after:-bottom-1.5 after:inset-x-0 after:h-0.5 after:rounded-full after:bg-margin")}>
        {miss && <span className="sr-only">Tu intento fallido: </span>}
        {clue.guess.map((d, i) => (
          <DigitTile
            key={i}
            digit={d}
            position={i}
            mark={marks ? tileMarkState(marks, row, i) : "none"}
            size={size}
            interactive={interactive}
            disabled={disabled}
            onClick={interactive ? () => onCycleMark?.(row, i) : undefined}
          />
        ))}
      </span>
      <Indicator kind="present" value={clue.feedback.present} />
    </li>
  );
}
