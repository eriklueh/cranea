import type { Edge, Island } from "@cranea/core/puentes";

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

/** Uno o dos trazos paralelos según la cantidad de puentes. */
export function BridgeLines({ islands, edge, count, className, strokeWidth = 0.09 }: {
  islands: readonly Island[];
  edge: Edge;
  count: number;
  className?: string;
  strokeWidth?: number;
}) {
  if (count <= 0) return null;
  const { x1, y1, x2, y2 } = edgeEnds(islands, edge);
  const offsets = count === 1 ? [0] : [-GAP, GAP];
  return (
    <g className={className}>
      {offsets.map((o) => (
        <line
          key={o}
          x1={edge.horizontal ? x1 : x1 + o}
          x2={edge.horizontal ? x2 : x2 + o}
          y1={edge.horizontal ? y1 + o : y1}
          y2={edge.horizontal ? y2 + o : y2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
