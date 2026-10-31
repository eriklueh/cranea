import type { CSSProperties } from "react";
import type { Edge, Island } from "@cranea/core/puentes";
import { cn } from "@/lib/utils";

/** Medidas en unidades de celda: el SVG usa viewBox = ancho × alto del tablero. */
export const ISLAND_R = 0.4;
const GAP = 0.11;

/** Extremos de la conexión, recortados en el borde de cada isla. */
export function edgeEnds(islands: readonly Island[], e: Edge) {
  const a = islands[e.a];
  const b = islands[e.b];
  const x1 = a.c + 0.5 + (e.horizontal ? ISLAND_R : 0);
  const y1 = a.r + 0.5 + (e.horizontal ? 0 : ISLAND_R);
  const x2 = b.c + 0.5 - (e.horizontal ? ISLAND_R : 0);
  const y2 = b.r + 0.5 - (e.horizontal ? 0 : ISLAND_R);
  return { x1, y1, x2, y2 };
}

/**
 * Uno o dos trazos paralelos según la cantidad de puentes.
 * Con `animate`, el primer trazo se dibuja desde la isla `from` y el segundo se separa del primero.
 */
export function BridgeLines({ islands, edge, count, className, strokeWidth = 0.09, animate = false, from = "a" }: {
  islands: readonly Island[];
  edge: Edge;
  count: number;
  className?: string;
  strokeWidth?: number;
  animate?: boolean;
  from?: "a" | "b";
}) {
  if (count <= 0) return null;
  const ends = edgeEnds(islands, edge);
  // El trazo arranca en la isla desde la que se tendió el puente.
  const { x1, y1, x2, y2 } = from === "b" ? { x1: ends.x2, y1: ends.y2, x2: ends.x1, y2: ends.y1 } : ends;
  const offsets = count === 1 ? [0] : [-GAP, GAP];
  return (
    <g className={className}>
      {offsets.map((o, k) => {
        // Unidades del viewBox: en SVG, los px de un transform CSS son unidades de usuario.
        const shift: CSSProperties = { transform: edge.horizontal ? `translate(0px, ${o}px)` : `translate(${o}px, 0px)` };
        return (
          <line
            key={k}
            x1={x1}
            x2={x2}
            y1={y1}
            y2={y2}
            pathLength={animate ? 1 : undefined}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={shift}
            className={cn(animate && "transition-[transform,stroke-width] duration-200 ease-out", animate && (k === 0 ? "anim-draw" : "anim-split"))}
          />
        );
      })}
    </g>
  );
}
