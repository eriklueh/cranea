import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const COLORS = ["bg-ok", "bg-clue-present", "bg-margin", "bg-ring", "bg-ok", "bg-ink"];
const COUNT = 14;

// Posiciones fijas (sin azar): el festejo es igual en cada partida y no depende del render.
const SPECKS = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + (i % 2 ? 0.18 : -0.12);
  const dist = 44 + ((i * 37) % 5) * 7;
  return {
    // Proporcional al tablero, pero con un mínimo para que se vea también sobre una fila de fichas.
    dx: `calc(${Math.cos(angle).toFixed(3)} * max(${dist}cqmin, ${Math.round(dist * 1.5)}px))`,
    dy: `calc(${Math.sin(angle).toFixed(3)} * max(${dist}cqmin, ${Math.round(dist * 1.5)}px))`,
    rot: `${(i % 3 ? 1 : -1) * (90 + i * 23)}deg`,
    delay: (i % 4) * 40,
    dash: i % 3 === 0,
    color: COLORS[i % COLORS.length],
  };
});

/**
 * Salpicadura de tinta y tiza que sale del centro del tablero al ganar.
 * Va dentro de un contenedor `relative`; no recibe toques y no se ve con movimiento reducido.
 */
export function WinBurst({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-visible [container-type:size] motion-reduce:hidden", className)}>
      {SPECKS.map((s, i) => (
        <span
          key={i}
          className={cn("anim-speck absolute rounded-full", s.dash ? "h-1 w-3" : "size-2", s.color)}
          style={{ "--dx": s.dx, "--dy": s.dy, "--rot": s.rot, "--delay": `${delay + s.delay}ms` } as CSSProperties}
        />
      ))}
    </span>
  );
}
