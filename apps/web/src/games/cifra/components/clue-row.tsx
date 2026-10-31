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
  /** Fila que señala una pista o un paso de la explicación. */
  highlight?: boolean;
  dim?: boolean;
}

export function ClueRow({ clue, marks, row = 0, miss, size = "md", interactive = false, disabled = false, onCycleMark, highlight, dim }: Props) {
  return (
    <li className={cn("flex items-center justify-center gap-2 rounded-lg transition-[background-color,box-shadow,opacity] duration-300 motion-reduce:transition-none", highlight && "bg-clue-present-bg shadow-[0_0_0_6px_var(--clue-present-bg)]", dim && "opacity-40")}>
      {highlight && <span className="sr-only">Fila señalada: </span>}
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
