import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lugar de los controles que, al terminar la partida, muestra "Ver resultado" en el mismo espacio.
 * Los controles quedan montados pero invisibles (y sin foco), así la página no cambia de alto:
 * antes se reemplazaban por un enlace chico, la página se acortaba y el navegador saltaba hacia abajo.
 */
export function FinishSlot({ finished, done, children, className }: { finished: boolean; done: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid", className)}>
      <div className={cn("[grid-area:1/1] min-w-0", finished && "invisible")} inert={finished} aria-hidden={finished || undefined}>
        {children}
      </div>
      {finished && <div className="anim-appear [grid-area:1/1] flex min-w-0 items-start justify-center">{done}</div>}
    </div>
  );
}
