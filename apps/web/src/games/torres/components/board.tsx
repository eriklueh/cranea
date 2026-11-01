"use client";
import { useMemo, type CSSProperties, type Ref } from "react";
import { clueState, duplicateCells, type ClueState, type Side, type TorresClues } from "@cranea/core/torres";
import { cn } from "@/lib/utils";
import { waveStep } from "@/lib/motion";

const SIDE_LABEL: Record<Side, string> = { top: "arriba", bottom: "abajo", left: "la izquierda", right: "la derecha" };
const STATE_LABEL: Record<ClueState, string> = { none: "", pending: "", ok: ", cumplida", conflict: ", no se cumple" };

interface Props {
  size: number;
  clues: TorresClues;
  givens: readonly number[];
  values: readonly number[];
  notes?: readonly number[];
  selected?: number | null;
  wrong?: readonly number[];
  onSelect?: (cell: number) => void;
  /** Sin interacción: para el resultado y el instructivo. */
  readOnly?: boolean;
  /** Muestra si cada pista se cumple. */
  feedback?: boolean;
  /** Las torres se levantan en una ola en diagonal (al ganar y en la solución). */
  wave?: boolean;
  gridRef?: Ref<HTMLDivElement>;
  className?: string;
}

/** Posición de una pista en la grilla exterior (1 = fila/columna de pistas, 2..n+1 = tablero). */
function place(side: Side, index: number, size: number): CSSProperties {
  if (side === "top") return { gridRow: 1, gridColumn: index + 2 };
  if (side === "bottom") return { gridRow: size + 2, gridColumn: index + 2 };
  if (side === "left") return { gridRow: index + 2, gridColumn: 1 };
  return { gridRow: index + 2, gridColumn: size + 2 };
}

function Clue({ value, state, side, index, size }: { value: number; state: ClueState; side: Side; index: number; size: number }) {
  if (!value) return null;
  const line = side === "top" || side === "bottom" ? `columna ${index + 1}` : `fila ${index + 1}`;
  return (
    <span className="grid place-items-center" style={place(side, index, size)}>
      <span
        role="img"
        data-tutorial={`clue-${side}-${index}`}
        aria-label={`Desde ${SIDE_LABEL[side]}, ${line}: se ven ${value}${STATE_LABEL[state]}`}
        className={cn(
          "grid size-[min(1.9rem,92%)] place-items-center rounded-full font-display text-[clamp(0.95rem,3.8vw,1.2rem)] font-bold tabular-nums transition-colors duration-300",
          // Cada cambio de estado tiene su propio gesto: un salto al cumplirse, un temblor al no cumplirse.
          state === "ok" && "anim-bump bg-clue-exact-bg text-clue-exact",
          state === "conflict" && "anim-nudge bg-margin text-paper",
        )}
      >
        {value}
      </span>
    </span>
  );
}

function Notes({ mask, size }: { mask: number; size: number }) {
  return (
    <span
      aria-hidden
      className="absolute inset-[8%] grid place-items-center text-[clamp(0.55rem,2.3vw,0.75rem)] leading-none font-semibold text-pencil tabular-nums"
      style={{ gridTemplateColumns: `repeat(${size <= 4 ? 2 : 3}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: size }, (_, k) => (
        <span key={k}>{mask & (1 << k) ? k + 1 : ""}</span>
      ))}
    </span>
  );
}

/** Tablero de Torres: casillas en el centro y pistas de borde alrededor. */
export function Board({ size, clues, givens, values, notes, selected = null, wrong = [], onSelect, readOnly = false, feedback = true, wave = false, gridRef, className }: Props) {
  const dupes = useMemo(() => duplicateCells(values, size), [values, size]);
  const wrongSet = useMemo(() => new Set(wrong), [wrong]);
  const range = Array.from({ length: size }, (_, i) => i);
  const sides: Side[] = ["top", "bottom", "left", "right"];
  const selRow = selected === null ? -1 : Math.floor(selected / size);
  const selCol = selected === null ? -1 : selected % size;
  const selValue = selected === null ? 0 : values[selected];
  const clueSize = "minmax(1.6rem, 0.62fr)";
  const style: CSSProperties = {
    gridTemplateColumns: `${clueSize} repeat(${size}, minmax(0, 1fr)) ${clueSize}`,
    gridTemplateRows: `${clueSize} repeat(${size}, auto) ${clueSize}`,
    maxWidth: `${size * 3.6 + 4}rem`,
  };

  const cell = (i: number) => {
    const r = Math.floor(i / size);
    const c = i % size;
    const v = values[i];
    const given = Boolean(givens[i]);
    const isSel = i === selected;
    const related = !isSel && (r === selRow || c === selCol);
    const sameValue = !isSel && v !== 0 && v === selValue;
    const conflict = dupes.has(i);
    const isWrong = wrongSet.has(i);
    const noteMask = v ? 0 : (notes?.[i] ?? 0);
    const noteList = range.filter((k) => noteMask & (1 << k)).map((k) => k + 1);
    const label = `Fila ${r + 1}, columna ${c + 1}: ${v ? `altura ${v}` : "vacía"}${given ? ", dada" : ""}${conflict ? ", repetida" : ""}${isWrong ? ", incorrecta" : ""}${noteList.length ? `, notas ${noteList.join(" ")}` : ""}`;
    const cls = cn(
      "relative grid aspect-square place-items-center font-display text-[clamp(1.15rem,6vw,1.9rem)] font-bold tabular-nums select-none outline-none transition-[color,background-color,box-shadow] duration-200 ease-out",
      "border-ink/20",
      c < size - 1 && "border-r",
      r < size - 1 && "border-b",
      given ? "text-ink" : "text-ring",
      related && "bg-accent/60",
      sameValue && "bg-clue-present-bg",
      isSel && "z-10 bg-tile ring-[3px] ring-ring ring-inset",
      conflict && "text-margin",
      isWrong && "bg-margin/15 text-margin",
    );
    const content = (
      <>
        {v ? (
          <span key={v} className={cn("inline-block origin-bottom", (wave || (!given && !readOnly)) && "anim-rise")} style={wave ? ({ "--i": r + c, "--step": waveStep(2 * size - 2, 320, 45) } as CSSProperties) : undefined}>
            {v}
          </span>
        ) : noteMask ? (
          <Notes mask={noteMask} size={size} />
        ) : null}
        {given && <span aria-hidden className="absolute inset-x-[32%] bottom-[13%] h-0.5 rounded bg-ink/35" />}
        {isWrong && <span aria-hidden className="anim-grow-x absolute inset-x-[22%] top-1/2 h-0.5 origin-left -rotate-12 rounded bg-margin" />}
      </>
    );
    const pos: CSSProperties = { gridRow: r + 2, gridColumn: c + 2 };
    if (readOnly) {
      return (
        <span key={i} role="img" aria-label={label} className={cls} style={pos}>
          {content}
        </span>
      );
    }
    return (
      <button
        key={i}
        type="button"
        data-cell={i}
        data-tutorial={`cell-${i}`}
        tabIndex={isSel || (selected === null && i === 0) ? 0 : -1}
        aria-label={label}
        aria-pressed={isSel}
        onClick={() => onSelect?.(i)}
        className={cn(cls, "cursor-pointer enabled:hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset")}
        style={pos}
      >
        {content}
      </button>
    );
  };

  return (
    <div ref={gridRef} data-tutorial={readOnly ? undefined : "board"} role="group" aria-label={`Tablero de ${size} por ${size}`} className={cn("mx-auto grid w-full", className)} style={style}>
      {/* Marco del tablero, detrás de las casillas. */}
      <span
        aria-hidden
        className="pointer-events-none rounded-md border-2 border-ink bg-card shadow-[0_4px_0_0_var(--shadow-ink)]"
        style={{ gridRow: `2 / span ${size}`, gridColumn: `2 / span ${size}`, margin: "-2px" }}
      />
      {range.flatMap((r) => range.map((c) => cell(r * size + c)))}
      {sides.flatMap((side) =>
        range.map((i) => (
          <Clue
            key={`${side}${i}`}
            side={side}
            index={i}
            size={size}
            value={clues[side][i]}
            state={feedback ? clueState(values, size, side, i, clues[side][i]) : "pending"}
          />
        )),
      )}
    </div>
  );
}
