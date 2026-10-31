"use client";
import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { bridgeCounts, type PuentesPuzzle } from "@cranea/core/puentes";
import { cn } from "@/lib/utils";
import { usePuentes } from "../store";
import { BridgeLines, edgeEnds } from "./geometry";

type Dir = "up" | "down" | "left" | "right";
const KEY_DIR: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

/** Para cada isla, la conexión y la vecina en cada dirección. */
function neighborMap(p: PuentesPuzzle) {
  const map = p.islands.map(() => ({}) as Partial<Record<Dir, { edge: number; other: number }>>);
  p.edges.forEach((e, edge) => {
    map[e.a][e.horizontal ? "right" : "down"] = { edge, other: e.b };
    map[e.b][e.horizontal ? "left" : "up"] = { edge, other: e.a };
  });
  return map;
}

/** Isla más cercana hacia un lado, aunque no esté en la misma línea (para moverse con flechas). */
function nearestToward(p: PuentesPuzzle, from: number, dir: Dir) {
  const o = p.islands[from];
  let best = -1;
  let bestScore = Infinity;
  p.islands.forEach((isl, i) => {
    const dr = isl.r - o.r;
    const dc = isl.c - o.c;
    const along = dir === "up" ? -dr : dir === "down" ? dr : dir === "left" ? -dc : dc;
    const across = dir === "up" || dir === "down" ? Math.abs(dc) : Math.abs(dr);
    if (along <= 0) return;
    const score = along + across * 2;
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best;
}

export function PuentesBoard({ puzzle }: { puzzle: PuentesPuzzle }) {
  // Hasta que el juego arranca este tablero, el store puede tener el anterior: se dibuja vacío.
  const live = usePuentes((s) => s.puzzle === puzzle);
  const storeBridges = usePuentes((s) => s.bridges);
  const bridges = useMemo(() => (live ? storeBridges : puzzle.edges.map(() => 0)), [live, storeBridges, puzzle]);
  const wrong = usePuentes((s) => s.wrong);
  const selected = usePuentes((s) => (live ? s.selected : null));
  const status = usePuentes((s) => s.status);
  const cycle = usePuentes((s) => s.cycle);
  const select = usePuentes((s) => s.select);
  const playing = live && status === "playing";

  const neighbors = useMemo(() => neighborMap(puzzle), [puzzle]);
  const counts = useMemo(() => bridgeCounts(puzzle.islands, puzzle.edges, bridges), [puzzle, bridges]);
  const [focus, setFocus] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const islandRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ island: number; x: number; y: number; edge: number | null; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const { width: W, height: H, islands, edges } = puzzle;

  const tap = (i: number) => {
    if (!playing) return;
    if (selected === null || selected === i) return select(selected === i ? null : i);
    const link = Object.values(neighbors[selected]).find((n) => n?.other === i);
    if (link) cycle(link.edge);
    else select(i);
  };

  const dirFromDelta = (dx: number, dy: number): Dir => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");

  const onPointerDown = (i: number, e: PointerEvent<HTMLButtonElement>) => {
    if (!playing || e.button !== 0) return;
    suppressClick.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { island: i, x: e.clientX, y: e.clientY, edge: null, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    const board = boardRef.current;
    if (!d || !board) return;
    const cell = board.getBoundingClientRect().width / W;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.35) {
      if (d.moved) { d.edge = null; setPreview(null); }
      return;
    }
    d.moved = true;
    d.edge = neighbors[d.island][dirFromDelta(dx, dy)]?.edge ?? null;
    setPreview(d.edge);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setPreview(null);
    if (!d?.moved) return;
    suppressClick.current = true;
    if (d.edge !== null) cycle(d.edge);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = KEY_DIR[e.key];
    if (dir) {
      e.preventDefault();
      if (e.shiftKey) {
        const link = neighbors[i][dir];
        if (link && playing) cycle(link.edge);
        return;
      }
      const next = neighbors[i][dir]?.other ?? nearestToward(puzzle, i, dir);
      if (next >= 0) {
        setFocus(next);
        islandRefs.current[next]?.focus();
      }
    } else if (e.key === "Escape" && selected !== null) {
      e.preventDefault();
      select(null);
    }
  };

  const selectable = selected === null ? new Set<number>() : new Set(Object.values(neighbors[selected]).map((n) => n!.other));

  return (
    <div
      ref={boardRef}
      className="@container relative mx-auto w-full select-none"
      style={{ aspectRatio: `${W} / ${H}`, maxWidth: `${Math.min(36, W * 3.25)}rem` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
        {/* Puntos de la grilla: ayudan a ver las líneas rectas. */}
        <g className="fill-pencil/25">
          {Array.from({ length: W * H }, (_, k) => (
            <circle key={k} cx={(k % W) + 0.5} cy={Math.floor(k / W) + 0.5} r={0.045} />
          ))}
        </g>
        {preview !== null && bridges[preview] < 2 && (
          <BridgeLines islands={islands} edge={edges[preview]} count={bridges[preview] + 1} className="text-pencil opacity-60" />
        )}
        {preview !== null && bridges[preview] === 2 && (
          <BridgeLines islands={islands} edge={edges[preview]} count={2} className="text-pencil opacity-40" strokeWidth={0.04} />
        )}
        {edges.map((edge, i) =>
          preview === i ? null : (
            <BridgeLines key={i} islands={islands} edge={edge} count={bridges[i]} className={live && wrong.includes(i) ? "text-margin" : "text-ink"} />
          ),
        )}
        {/* Zonas para tocar el espacio entre dos islas. */}
        {playing &&
          edges.map((edge, i) => {
            const { x1, y1, x2, y2 } = edgeEnds(islands, edge);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={0.55}
                className="cursor-pointer"
                style={{ pointerEvents: "stroke" }}
                onClick={() => cycle(i)}
              />
            );
          })}
      </svg>

      <div role="group" aria-label="Islas" className="pointer-events-none absolute inset-0">
        {islands.map((isl, i) => {
          const have = counts[i];
          const complete = have === isl.n;
          const over = have > isl.n;
          const isSelected = selected === i;
          return (
            <button
              key={i}
              ref={(el) => { islandRefs.current[i] = el; }}
              type="button"
              tabIndex={focus === i ? 0 : -1}
              aria-pressed={playing ? isSelected : undefined}
              aria-disabled={!playing || undefined}
              aria-label={`Isla ${isl.n}, fila ${isl.r + 1}, columna ${isl.c + 1}: ${have} de ${isl.n} puentes${complete ? ", completa" : over ? ", sobran puentes" : ""}.`}
              onFocus={() => setFocus(i)}
              onPointerDown={(e) => onPointerDown(i, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { drag.current = null; setPreview(null); }}
              onClick={() => {
                if (suppressClick.current) { suppressClick.current = false; return; }
                tap(i);
              }}
              onKeyDown={(e) => onKeyDown(i, e)}
              className="group pointer-events-auto absolute grid touch-none place-items-center outline-none"
              style={{ left: `${(isl.c / W) * 100}%`, top: `${(isl.r / H) * 100}%`, width: `${100 / W}%`, height: `${100 / H}%` }}
            >
              <span
                className={cn(
                  "grid aspect-square w-[80%] place-items-center rounded-full border-2 font-display font-bold tabular-nums transition-colors",
                  complete ? "border-ok bg-ok text-paper" : over ? "border-margin bg-tile text-margin" : "border-ink bg-tile text-ink",
                  playing && !complete && !over && "group-hover:bg-accent",
                  isSelected && "ring-[3px] ring-ring ring-offset-2 ring-offset-paper",
                  !isSelected && selectable.has(i) && "ring-2 ring-ring/50",
                  "group-focus-visible:ring-[3px] group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-paper",
                )}
                style={{ fontSize: `${42 / W}cqw` }}
              >
                {isl.n}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
