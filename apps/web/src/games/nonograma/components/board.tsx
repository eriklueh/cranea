"use client";
import { useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { colCells, emptyBoard, lineDone, rowCells, EMPTY, FILLED, type Cell, type NonogramaPuzzle } from "@cranea/core/nonograma";
import { cn } from "@/lib/utils";
import { useNonograma } from "../store";

const NONE: number[] = [];
const STATE_LABEL: Record<Cell, string> = { 0: "vacía", 1: "pintada", 2: "con cruz" };

const SIZING: Record<number, { box: string; clue: string; gap: string }> = {
  5: { box: "max-w-[21rem]", clue: "text-base", gap: "gap-1.5" },
  10: { box: "max-w-[27rem]", clue: "text-sm", gap: "gap-1" },
  15: { box: "max-w-[34rem]", clue: "text-[0.66rem] sm:text-sm", gap: "gap-[3px] sm:gap-1" },
};

/** Tablero con pistas. Tocar o arrastrar en línea recta pinta; la primera casilla decide si pinta o borra. */
export function Board({ puzzle }: { puzzle: NonogramaPuzzle }) {
  // Hasta que arranca la partida (y en el HTML prerenderizado) se muestra el tablero vacío.
  const live = useNonograma((s) => s.puzzle === puzzle);
  const storeBoard = useNonograma((s) => s.board);
  const board = useMemo(() => (live ? storeBoard : emptyBoard(puzzle)), [live, storeBoard, puzzle]);
  const cursor = useNonograma((s) => (live ? s.cursor : null));
  const flagged = useNonograma((s) => (live ? s.flagged : NONE));
  const status = useNonograma((s) => (live ? s.status : "playing"));
  const cellsRef = useRef<HTMLDivElement>(null);

  const done = useMemo(
    () => ({
      rows: puzzle.rows.map((clue, r) => lineDone(rowCells(board, puzzle.width, r), clue)),
      cols: puzzle.cols.map((clue, c) => lineDone(colCells(board, puzzle.width, c), clue)),
    }),
    [board, puzzle],
  );
  const flaggedSet = useMemo(() => new Set(flagged), [flagged]);

  const { width: W, height: H } = puzzle;
  const sizing = SIZING[W] ?? SIZING[15];
  const playing = status === "playing";
  const cursorRow = cursor === null ? -1 : Math.floor(cursor / W);
  const cursorCol = cursor === null ? -1 : cursor % W;

  const indexAt = (x: number, y: number) => {
    const rect = cellsRef.current!.getBoundingClientRect();
    const c = Math.min(W - 1, Math.max(0, Math.floor(((x - rect.left) / rect.width) * W)));
    const r = Math.min(H - 1, Math.max(0, Math.floor(((y - rect.top) / rect.height) * H)));
    return r * W + c;
  };
  const focusCell = (i: number) => cellsRef.current?.querySelector<HTMLElement>(`[data-cell="${i}"]`)?.focus({ preventScroll: true });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!live || !playing || (e.button !== 0 && e.button !== 2)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const i = indexAt(e.clientX, e.clientY);
    // Clic derecho: cruz, sin cambiar de herramienta.
    useNonograma.getState().beginStroke(i, e.button === 2 ? "cross" : undefined);
    focusCell(i);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (useNonograma.getState().stroke) useNonograma.getState().moveStroke(indexAt(e.clientX, e.clientY));
  };
  const onPointerEnd = () => useNonograma.getState().endStroke();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!live) return;
    const s = useNonograma.getState();
    const at = s.cursor ?? 0;
    const r = Math.floor(at / W);
    const c = at % W;
    const move: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (move[e.key]) {
      e.preventDefault();
      const [dr, dc] = move[e.key];
      const next = Math.min(H - 1, Math.max(0, r + dr)) * W + Math.min(W - 1, Math.max(0, c + dc));
      if (s.stroke) s.moveStroke(next);
      else s.setCursor(next);
      focusCell(next);
      return;
    }
    if (!playing || e.repeat) return;
    const tool = e.key === "x" || e.key === "X" ? "cross" : e.key === "Enter" || e.key === " " ? s.tool : null;
    if (!tool) return;
    e.preventDefault();
    // Mantener la tecla y moverse con las flechas pinta un tramo, como arrastrar.
    s.beginStroke(at, tool);
  };
  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (["x", "X", "Enter", " "].includes(e.key)) useNonograma.getState().endStroke();
  };

  const finished = !playing;
  const cellState = (i: number): Cell => (finished ? (puzzle.solution[i] ? FILLED : 0) : board[i]);

  return (
    <div className={cn("mx-auto grid w-full grid-cols-[auto_1fr] select-none", sizing.box)}>
      <div />
      <div className="grid items-end pb-1" style={{ gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))` }} aria-hidden>
        {puzzle.cols.map((clue, c) => (
          <div
            key={c}
            className={cn(
              "flex flex-col items-center justify-end rounded-t-sm pb-0.5 font-display leading-tight font-bold tabular-nums transition-opacity",
              sizing.clue,
              (done.cols[c] || finished) && "opacity-35",
              playing && c === cursorCol && "bg-accent",
            )}
          >
            {(clue.length ? clue : [0]).map((n, k) => (
              <span key={k}>{n}</span>
            ))}
          </div>
        ))}
      </div>

      <div className="grid pr-1.5" style={{ gridTemplateRows: `repeat(${H}, minmax(0, 1fr))` }} aria-hidden>
        {puzzle.rows.map((clue, r) => (
          <div
            key={r}
            className={cn(
              "flex items-center justify-end rounded-l-sm pl-1 font-display font-bold whitespace-nowrap tabular-nums transition-opacity",
              sizing.clue,
              sizing.gap,
              (done.rows[r] || finished) && "opacity-35",
              playing && r === cursorRow && "bg-accent",
            )}
          >
            {(clue.length ? clue : [0]).map((n, k) => (
              <span key={k}>{n}</span>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={cellsRef}
        role="grid"
        aria-label={`Tablero de ${W} por ${H}`}
        aria-readonly={!playing}
        className={cn(
          "grid aspect-square touch-none overflow-hidden rounded-sm border-2 border-ink bg-tile shadow-[0_4px_0_0_var(--shadow-ink)]",
          finished && status === "won" && "border-ok shadow-[0_4px_0_0_var(--ok)]",
        )}
        style={{ gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))`, aspectRatio: `${W} / ${H}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        {Array.from({ length: H }, (_, r) => (
          <div key={r} role="row" className="contents">
            {Array.from({ length: W }, (_, c) => {
              const i = r * W + c;
              const state = cellState(i);
              const near = playing && (r === cursorRow || c === cursorCol);
              const rowClue = puzzle.rows[r].join(" ") || "0";
              const colClue = puzzle.cols[c].join(" ") || "0";
              return (
                <div
                  key={c}
                  role="gridcell"
                  data-cell={i}
                  tabIndex={i === (cursor ?? 0) ? 0 : -1}
                  aria-label={`Fila ${r + 1} (${rowClue}), columna ${c + 1} (${colClue}): ${STATE_LABEL[state]}${flaggedSet.has(i) ? ", revisar" : ""}`}
                  onFocus={() => useNonograma.getState().cursor !== i && useNonograma.getState().setCursor(i)}
                  className={cn(
                    "relative outline-none focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset",
                    c < W - 1 && ((c + 1) % 5 === 0 ? "border-r-2 border-r-ink/55" : "border-r border-r-ink/15"),
                    r < H - 1 && ((r + 1) % 5 === 0 ? "border-b-2 border-b-ink/55" : "border-b border-b-ink/15"),
                    state === FILLED ? "bg-ink" : near ? "bg-accent/70" : "bg-tile",
                    finished && "transition-colors duration-500",
                  )}
                >
                  {state === EMPTY && <CrossMark />}
                  {flaggedSet.has(i) && <span aria-hidden className="absolute inset-0 bg-margin/25 ring-2 ring-margin ring-inset" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CrossMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className={cn("absolute inset-[18%] text-pencil", className)}>
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
