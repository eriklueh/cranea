import { findEdges, islandsFromRows, type Bridges } from "@cranea/core/puentes";
import { cn } from "@/lib/utils";
import { BridgeLines, ISLAND_R } from "./geometry";

/** Tablero de solo lectura: para ejemplos y la tarjeta de inicio. */
export function StaticBoard({ rows, bridges, done = [], className, label }: {
  rows: readonly string[];
  /** Puentes en el orden de findEdges. */
  bridges?: Bridges;
  /** Islas que se muestran completas. */
  done?: readonly number[];
  className?: string;
  label?: string;
}) {
  const islands = islandsFromRows(rows);
  const edges = findEdges(islands);
  const width = rows[0].length;
  const height = rows.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className="text-ink">
        {edges.map((e, i) => (
          <BridgeLines key={i} islands={islands} edge={e} count={bridges?.[i] ?? 0} />
        ))}
      </g>
      {islands.map((isl, i) => {
        const complete = done.includes(i);
        return (
          <g key={i}>
            <circle
              cx={isl.c + 0.5}
              cy={isl.r + 0.5}
              r={ISLAND_R}
              strokeWidth={0.08}
              className={complete ? "fill-ok stroke-ok" : "fill-tile stroke-ink"}
            />
            <text
              x={isl.c + 0.5}
              y={isl.r + 0.5}
              dy="0.35em"
              textAnchor="middle"
              fontSize={0.48}
              className={cn("font-display font-bold", complete ? "fill-paper" : "fill-ink")}
            >
              {isl.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Tablero de ejemplo con solución única. Conexiones: 4–2, 4–3, 2–1, 3–1. */
export const EXAMPLE_ROWS = ["4...2", ".....", "3...1"];
export const EXAMPLE_SOLUTION = [2, 2, 0, 1];

/** Arte chico para la tarjeta del juego en el inicio. */
export function PuentesPreview() {
  return <StaticBoard rows={EXAMPLE_ROWS} bridges={EXAMPLE_SOLUTION} done={[0, 1, 2, 3]} className="h-16 w-auto sm:h-20" />;
}
