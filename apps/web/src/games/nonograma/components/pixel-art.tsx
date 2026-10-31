import { cn } from "@/lib/utils";

/** Dibujo en píxeles como un solo path SVG: nítido en cualquier tamaño. */
export function PixelArt({ rows, className, label }: { rows: readonly string[]; className?: string; label?: string }) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  let d = "";
  rows.forEach((row, r) => {
    let c = 0;
    while (c < width) {
      if (row[c] !== "#") { c++; continue; }
      let end = c;
      while (end < width && row[end] === "#") end++;
      d += `M${c} ${r}h${end - c}v1h${c - end}z`;
      c = end;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={cn("text-ink", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export const solutionRows = (solution: readonly boolean[], width: number) =>
  Array.from({ length: solution.length / width }, (_, r) => solution.slice(r * width, (r + 1) * width).map((f) => (f ? "#" : ".")).join(""));
