"use client";

import { CheckIcon, PencilIcon, Trash2Icon, Undo2Icon } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };
type Stroke = Point[];

function path(points: Stroke) {
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} l 0.01 0`;
  return points.map((point, i) => `${i ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
}

/** Notas libres de la partida: no alteran las marcas ni el progreso. */
export function DrawingBoard({ active, onActiveChange, children }: {
  active: boolean;
  onActiveChange: (active: boolean) => void;
  children: ReactNode;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const current = useRef<{ pointer: number; points: Stroke } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<Stroke>([]);

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Guardamos x respecto del centro, como las fichas. Agregar una fila de
  // intento o cambiar el ancho de pantalla no estira los trazos existentes.
  const point = (event: { clientX: number; clientY: number }, target: SVGSVGElement): Point => {
    const rect = target.getBoundingClientRect();
    return { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top };
  };
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (current.current?.pointer !== event.pointerId) return;
    const completed = current.current.points;
    current.current = null;
    setStrokes((previous) => [...previous, completed]);
    setDraft([]);
  };
  const buttonClass = "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-35 disabled:pointer-events-none";

  return <>
    <div data-drawing-controls className="mb-2 flex min-h-11 items-center justify-end gap-1" role="group" aria-label="Herramientas de dibujo">
      {(active || strokes.length > 0) && <>
        <button type="button" className={buttonClass} disabled={strokes.length === 0} onClick={() => setStrokes((previous) => previous.slice(0, -1))} aria-label="Deshacer último trazo" title="Deshacer último trazo">
          <Undo2Icon className="size-4" />
        </button>
        <button type="button" className={buttonClass} disabled={strokes.length === 0} onClick={() => setStrokes([])} aria-label="Borrar dibujo" title="Borrar dibujo">
          <Trash2Icon className="size-4" />
        </button>
      </>}
      <button type="button" className={cn(buttonClass, active && "bg-ink text-paper hover:bg-ink/90")} aria-pressed={active} aria-label={active ? "Terminar de dibujar" : "Dibujar sobre el tablero"} title={active ? "Terminar de dibujar (Escape)" : "Dibujar sobre el tablero"} onClick={() => onActiveChange(!active)}>
        {active ? <CheckIcon className="size-4" /> : <PencilIcon className="size-4" />}
        {active ? "Listo" : "Lápiz"}
      </button>
    </div>
    <div ref={surface} className="relative isolate" data-drawing-board>
      <div inert={active || undefined}>{children}</div>
      <svg
        role="img"
        aria-label={active ? "Superficie para dibujar sobre el juego" : "Dibujo de esta partida"}
        className={cn("absolute inset-0 z-10 size-full overflow-hidden text-ink", active ? "cursor-crosshair touch-none" : "pointer-events-none")}
        viewBox={size.width && size.height ? `${-size.width / 2} 0 ${size.width} ${size.height}` : undefined}
        onPointerDown={(event) => {
          if (!active || event.button !== 0 || current.current) return;
          event.preventDefault();
          const points = [point(event, event.currentTarget)];
          current.current = { pointer: event.pointerId, points };
          setDraft(points);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (current.current?.pointer !== event.pointerId) return;
          const samples = event.nativeEvent.getCoalescedEvents?.() ?? [];
          const points = [...current.current.points, ...(samples.length ? samples : [event]).map((sample) => point(sample, event.currentTarget))];
          current.current.points = points;
          setDraft(points);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
      >
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          {strokes.map((stroke, i) => <path key={i} d={path(stroke)} data-drawing-stroke />)}
          {draft.length > 0 && <path d={path(draft)} />}
        </g>
      </svg>
    </div>
  </>;
}
