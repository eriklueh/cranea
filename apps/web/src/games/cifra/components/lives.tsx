"use client";
import { cn } from "@/lib/utils";
import { MAX_ATTEMPTS, useCifra } from "../store";

export function Lives() {
  const used = useCifra((s) => s.misses.length);
  const left = MAX_ATTEMPTS - used;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Te quedan ${left} de ${MAX_ATTEMPTS} intentos`}>
      {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
        <span key={i} className={cn("h-4 w-1.5 rounded-full", i < left ? "bg-ink" : "bg-margin/40")} />
      ))}
    </span>
  );
}
