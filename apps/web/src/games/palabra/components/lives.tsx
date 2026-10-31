"use client";
import { cn } from "@/lib/utils";
import { usePalabra } from "../store";

export function Lives() {
  const used = usePalabra((s) => s.misses.length);
  const total = usePalabra((s) => s.puzzle?.attempts ?? 6);
  const left = total - used;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Te quedan ${left} de ${total} intentos`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("h-4 w-1.5 rounded-full transition-[background-color,scale] duration-300 ease-out", i < left ? "bg-ink" : "scale-y-60 bg-margin/40")} />
      ))}
    </span>
  );
}
