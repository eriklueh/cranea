"use client";
import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { bridgeCounts, type PuentesPuzzle } from "@cranea/core/puentes";
import { cn } from "@/lib/utils";
import { haptic, play, SHAKE, useOnChange } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { WinBurst } from "@/components/win-burst";
import { usePuentes } from "../store";
import { BridgeLines, edgeEnds } from "./geometry";

type Dir = "up" | "down" | "left" | "right";
const KEY_DIR: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
/** Empujoncito para un puente que cruzaría otro: más suave que la sacudida de un error. */
const NUDGE: Keyframe[] = [{ transform: "translateX(0)" }, { transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }];

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
  const mistakes = usePuentes((s) => s.mistakes);
  const notice = usePuentes((s) => s.notice);
  const playing = live && status === "playing";
  const won = live && status === "won";

  const neighbors = useMemo(() => neighborMap(puzzle), [puzzle]);
  const counts = useMemo(() => bridgeCounts(puzzle.islands, puzzle.edges, bridges), [puzzle, bridges]);
  const [focus, setFocus] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const islandRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ island: number; x: number; y: number; edge: number | null; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const ghostRef = useRef<HTMLSpanElement>(null);
  // Isla desde la que se tendió el último puente: el trazo se dibuja desde ahí.
  const [origin, setOrigin] = useState<{ edge: number; island: number } | null>(null);

  useOnChange(mistakes, (n, before) => {
    if (!live || n <= before) return;
    haptic("invalid");
    play(boardRef, SHAKE);
  });
  useOnChange(notice, (n) => {
    if (!live || n?.kind !== "blocked") return;
    haptic("invalid");
    play(boardRef, NUDGE, { duration: 220, easing: "ease-in-out" });
  });
  useOnChange(won, (w) => w && haptic("win"));
  useOnChange(bridges, () => live && sound("tap"));

  // Marca que sigue al dedo mientras se arrastra, sin volver a renderizar.
  const moveGhost = (x: number, y: number) => {
    const g = ghostRef.current;
    if (!g) return;
    g.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    g.style.opacity = "1";
  };
  const hideGhost = () => {
    if (ghostRef.current) ghostRef.current.style.opacity = "0";
  };

  const { width: W, height: H, islands, edges } = puzzle;

  const tap = (i: number) => {
    if (!playing) return;
    if (selected === null || selected === i) return select(selected === i ? null : i);
    const link = Object.values(neighbors[selected]).find((n) => n?.other === i);
    if (link) {
      setOrigin({ edge: link.edge, island: selected });
      cycle(link.edge);
    }
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
    const rect = board.getBoundingClientRect();
    const cell = rect.width / W;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.35) {
      if (d.moved) { d.edge = null; setPreview(null); }
      hideGhost();
      return;
    }
    d.moved = true;
    moveGhost(e.clientX - rect.left, e.clientY - rect.top);
    d.edge = neighbors[d.island][dirFromDelta(dx, dy)]?.edge ?? null;
    if (d.edge !== null && (origin?.edge !== d.edge || origin.island !== d.island)) setOrigin({ edge: d.edge, island: d.island });
    setPreview(d.edge);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setPreview(null);
    hideGhost();
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
      data-tutorial="board"
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
        {/* La vista previa del arrastre es el mismo trazo en lápiz: al soltar se entinta sin volver a dibujarse. */}
        {edges.map((edge, i) => {
          const ghost = preview === i;
          const removing = ghost && bridges[i] === 2;
          return (
            <BridgeLines
              key={i}
              islands={islands}
              edge={edge}
              count={ghost ? (removing ? 2 : bridges[i] + 1) : bridges[i]}
              strokeWidth={removing ? 0.04 : undefined}
              animate={live}
              from={origin?.edge === i && origin.island === edge.b ? "b" : "a"}
              className={cn(
                "transition-[color,opacity] duration-300",
                ghost ? cn("text-pencil", removing ? "opacity-40" : "opacity-60") : live && wrong.includes(i) ? "anim-flash text-margin" : won ? "text-ok" : "text-ink",
              )}
            />
          );
        })}
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
          // Al completarse, la isla late; al ganar, todas laten en una ola en diagonal.
          const motion = won ? "anim-ripple" : complete && live ? "anim-bump" : undefined;
          return (
            <button
              key={i}
              ref={(el) => { islandRefs.current[i] = el; }}
              type="button"
              data-tutorial={`island-${i}`}
              tabIndex={focus === i ? 0 : -1}
              aria-pressed={playing ? isSelected : undefined}
              aria-disabled={!playing || undefined}
              aria-label={`Isla ${isl.n}, fila ${isl.r + 1}, columna ${isl.c + 1}: ${have} de ${isl.n} puentes${complete ? ", completa" : over ? ", sobran puentes" : ""}.`}
              onFocus={() => setFocus(i)}
              onPointerDown={(e) => onPointerDown(i, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { drag.current = null; setPreview(null); hideGhost(); }}
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
                  "relative grid aspect-square w-[80%] place-items-center rounded-full border-2 font-display font-bold tabular-nums transition-[color,background-color,border-color,box-shadow,scale] duration-200 ease-out",
                  motion,
                  isSelected && "scale-110",
                  complete ? "border-ok bg-ok text-paper" : over ? "border-margin bg-tile text-margin" : "border-ink bg-tile text-ink",
                  playing && !complete && !over && "group-hover:bg-accent",
                  isSelected && "ring-[3px] ring-ring ring-offset-2 ring-offset-paper",
                  !isSelected && selectable.has(i) && "ring-2 ring-ring/50",
                  "group-focus-visible:ring-[3px] group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-paper",
                )}
                style={{ fontSize: `${42 / W}cqw`, "--i": isl.r + isl.c } as CSSProperties}
              >
                {isl.n}
                {/* Anillo que se abre cuando la isla queda completa. */}
                {complete && live && <span aria-hidden className="anim-ring-out pointer-events-none absolute -inset-0.5 rounded-full border-2 border-ok" />}
              </span>
            </button>
          );
        })}
      </div>
      <span
        ref={ghostRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 aspect-square rounded-full bg-ring/20 opacity-0 ring-2 ring-ring/45 transition-opacity duration-150 will-change-transform"
        style={{ width: `${55 / W}%` }}
      />
      {won && <WinBurst />}
    </div>
  );
}
