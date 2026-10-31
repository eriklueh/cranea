import { cn } from "@/lib/utils";

const HEART = [".#.#.", "#####", "#####", ".###.", "..#.."];
const ROWS = ["1 1", "5", "5", "3", "1"];
const COLS = ["2", "4", "4", "4", "2"];
/** Casillas ya resueltas en la vista previa: las tres primeras filas. */
const SOLVED_ROWS = 3;

/** Arte de la tarjeta de inicio: un corazón de 5×5 a medio pintar, con sus pistas. */
export function NonogramaPreview() {
  return (
    <div aria-hidden className="grid grid-cols-[auto_repeat(5,1.25rem)] gap-px font-display text-[0.7rem] leading-none font-bold text-pencil">
      <span />
      {COLS.map((c, i) => (
        <span key={i} className="grid h-5 place-items-end justify-center pb-0.5">{c}</span>
      ))}
      {HEART.map((row, r) => (
        <PreviewRow key={r} clue={ROWS[r]} row={row} solved={r < SOLVED_ROWS} />
      ))}
    </div>
  );
}

function PreviewRow({ clue, row, solved }: { clue: string; row: string; solved: boolean }) {
  return (
    <>
      <span className={cn("flex items-center justify-end pr-1.5 whitespace-nowrap", solved && "opacity-40")}>{clue}</span>
      {[...row].map((ch, c) => (
        <span
          key={c}
          className={cn(
            "relative size-5 rounded-[3px] border border-ink/70",
            solved && ch === "#" ? "bg-ink" : "bg-tile",
          )}
        >
          {solved && ch === "." && <Cross />}
        </span>
      ))}
    </>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 10 10" className="absolute inset-0.5 text-pencil">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
