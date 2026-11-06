"use client";
import { useMemo, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { colCells, emptyBoard, lineDone, rowCells, EMPTY, FILLED, type Cell, type NonogramaPuzzle } from "@cranea/core/nonograma";
import { cn } from "@/lib/utils";
import { celebrateStep, haptic, play, useOnChange } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { WinBurst } from "@/components/win-burst";
import { useT, type T } from "@/lib/i18n";
import { useNonograma } from "../store";
import { HINT_COPY } from "../hint-copy";
import { useHintLine } from "./hint";

const NONE: number[] = [];
const STATE_LABEL = (t: T): Record<Cell, string> => ({ 0: t("nonograma.cellEmpty"), 1: t("nonograma.cellFilled"), 2: t("nonograma.cellCrossed") });

const SIZING: Record<number, { box: string; clue: string; gap: string }> = {
  4: { box: "max-w-[17rem]", clue: "text-lg", gap: "gap-2" },
  5: { box: "max-w-[21rem]", clue: "text-base", gap: "gap-1.5" },
  10: { box: "max-w-[27rem]", clue: "text-sm", gap: "gap-1" },
  15: { box: "max-w-[34rem]", clue: "text-[0.66rem] sm:text-sm", gap: "gap-[3px] sm:gap-1" },
};

/** Tablero con pistas. Tocar o arrastrar en línea recta pinta; la primera casilla decide si pinta o borra. */
export function Board({ puzzle }: { puzzle: NonogramaPuzzle }) {
  const t = useT();
  // Hasta que arranca la partida (y en el HTML prerenderizado) se muestra el tablero vacío.
  const live = useNonograma((s) => s.puzzle === puzzle);
  const storeBoard = useNonograma((s) => s.board);
  const board = useMemo(() => (live ? storeBoard : emptyBoard(puzzle)), [live, storeBoard, puzzle]);
  const cursor = useNonograma((s) => (live ? s.cursor : null));
  const flagged = useNonograma((s) => (live ? s.flagged : NONE));
  const status = useNonograma((s) => (live ? s.status : "playing"));
  const hinted = useHintLine();
  const cellsRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  useOnChange(flagged, (f) => {
    if (!f.length) return;
    haptic("invalid");
    play(boxRef);
  });
  useOnChange(status, (s) => s === "won" && haptic("win"));

  const done = useMemo(
    () => ({
      rows: puzzle.rows.map((clue, r) => lineDone(rowCells(board, puzzle.width, r), clue)),
      cols: puzzle.cols.map((clue, c) => lineDone(colCells(board, puzzle.width, c), clue)),
    }),
    [board, puzzle],
  );
  useOnChange(board, () => live && sound("tap"));
  useOnChange(done.rows.filter(Boolean).length + done.cols.filter(Boolean).length, (n, before) => live && n > before && sound("line"));
  const flaggedSet = useMemo(() => new Set(flagged), [flagged]);

  const { width: W, height: H } = puzzle;
  const sizing = SIZING[W] ?? SIZING[15];
  const playing = status === "playing";
  const cursorRow = cursor === null ? -1 : Math.floor(cursor / W);
  const cursorCol = cursor === null ? -1 : cursor % W;
  // La línea que señala la pista: mismo resaltado que la del cursor, con el color de las pistas y un latido (`confirm`).
  const hintRow = live && playing && hinted?.line === "row" ? hinted.index : -1;
  const hintCol = live && playing && hinted?.line === "col" ? hinted.index : -1;
  // Al terminar, el dibujo aparece (o late, si ganaste) en una ola diagonal de ≤ 600 ms (como la app).
  const step = celebrateStep(W + H - 2);

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
    <div ref={boxRef} data-tutorial="board" className={cn("anim-appear relative mx-auto grid w-full grid-cols-[auto_1fr] select-none", sizing.box)}>
      <div />
      <div className="grid items-end pb-1" style={{ gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))` }} aria-hidden>
        {puzzle.cols.map((clue, c) => (
          <div
            key={c}
            data-tutorial={`col-clue-${c}`}
            className={cn(
              "flex flex-col items-center justify-end rounded-t-sm pb-0.5 font-display leading-tight font-bold tabular-nums transition-[opacity,background-color] duration-(--dur-slow)",
              sizing.clue,
              (done.cols[c] || finished) && c !== hintCol && "opacity-35",
              playing && c === cursorCol && "bg-accent",
              c === hintCol && "anim-bump bg-clue-present-bg text-clue-present",
            )}
          >
            {c === hintCol && <span className="sr-only">{HINT_COPY.marked}</span>}
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
            data-tutorial={`row-clue-${r}`}
            className={cn(
              "flex items-center justify-end rounded-l-sm pl-1 font-display font-bold whitespace-nowrap tabular-nums transition-[opacity,background-color] duration-(--dur-slow)",
              sizing.clue,
              sizing.gap,
              (done.rows[r] || finished) && r !== hintRow && "opacity-35",
              playing && r === cursorRow && "bg-accent",
              r === hintRow && "anim-bump bg-clue-present-bg text-clue-present",
            )}
          >
            {r === hintRow && <span className="sr-only">{HINT_COPY.marked}</span>}
            {(clue.length ? clue : [0]).map((n, k) => (
              <span key={k}>{n}</span>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={cellsRef}
        role="grid"
        aria-label={t("nonograma.boardLabel", { w: W, h: H })}
        aria-readonly={!playing}
        className={cn(
          "relative grid aspect-square touch-none overflow-hidden rounded-sm border-2 border-ink bg-tile shadow-[0_4px_0_0_var(--shadow-ink)] transition-[border-color,box-shadow] duration-(--dur-slow)",
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
                  data-tutorial={`cell-${i}`}
                  tabIndex={i === (cursor ?? 0) ? 0 : -1}
                  aria-label={`${t("nonograma.cellLabel", { r: r + 1, rowClue, c: c + 1, colClue, state: STATE_LABEL(t)[state] })}${flaggedSet.has(i) ? t("nonograma.cellFlagged") : ""}`}
                  onFocus={() => useNonograma.getState().cursor !== i && useNonograma.getState().setCursor(i)}
                  className={cn(
                    // El foco es un outline: queda encima de la tinta de la casilla.
                    "relative outline-none focus-visible:z-10 focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring",
                    c < W - 1 && ((c + 1) % 5 === 0 ? "border-r-2 border-r-ink/55" : "border-r border-r-ink/15"),
                    r < H - 1 && ((r + 1) % 5 === 0 ? "border-b-2 border-b-ink/55" : "border-b border-b-ink/15"),
                    near ? "bg-accent/70" : "bg-tile",
                    finished && "transition-colors duration-(--dur-slow)",
                  )}
                  style={{ "--i": r + c, "--step": finished ? step : "0ms" } as CSSProperties}
                >
                  {/* `stamp` al pintar; al ganar, el dibujo late en diagonal (`celebrate`). */}
                  {state === FILLED && <span aria-hidden className={cn("absolute inset-0 bg-ink", status === "won" ? "anim-dip" : "anim-stamp")} />}
                  {state === EMPTY && <CrossMark animate />}
                  {flaggedSet.has(i) && <span aria-hidden className="anim-fade absolute inset-0 bg-margin/25 ring-2 ring-margin ring-inset" />}
                </div>
              );
            })}
          </div>
        ))}
        {hintRow >= 0 && (
          <span key={`hr${hintRow}`} aria-hidden className="anim-fade pointer-events-none absolute inset-x-0 bg-clue-present-bg/45 ring-2 ring-clue-present ring-inset" style={{ top: `${(hintRow / H) * 100}%`, height: `${100 / H}%` }} />
        )}
        {hintCol >= 0 && (
          <span key={`hc${hintCol}`} aria-hidden className="anim-fade pointer-events-none absolute inset-y-0 bg-clue-present-bg/45 ring-2 ring-clue-present ring-inset" style={{ left: `${(hintCol / W) * 100}%`, width: `${100 / W}%` }} />
        )}
        {/* Una pasada de color sobre cada fila o columna que queda completa. */}
        {playing &&
          puzzle.rows.map((clue, r) =>
            done.rows[r] && clue.length > 0 ? (
              <span key={`r${r}`} aria-hidden className="anim-sweep pointer-events-none absolute inset-x-0 bg-ok/20" style={{ top: `${(r / H) * 100}%`, height: `${100 / H}%` }} />
            ) : null,
          )}
        {playing &&
          puzzle.cols.map((clue, c) =>
            done.cols[c] && clue.length > 0 ? (
              <span key={`c${c}`} aria-hidden className="anim-sweep-y pointer-events-none absolute inset-y-0 bg-ok/20" style={{ left: `${(c / W) * 100}%`, width: `${100 / W}%` }} />
            ) : null,
          )}
      </div>
      {status === "won" && <WinBurst />}
    </div>
  );
}

export function CrossMark({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className={cn("absolute inset-[18%] text-pencil", className)}>
      {/* Con `animate`, la cruz se traza de un tirón: primero un palito y después el otro. */}
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" pathLength={animate ? 1 : undefined} className={animate ? "anim-draw" : undefined} />
    </svg>
  );
}
