import { cn } from "@/lib/utils";

type Kind = "exact" | "present";

function Symbol({ kind }: { kind: Kind }) {
  return <span aria-hidden className={cn("size-3 shrink-0 rounded-full", kind === "exact" ? "bg-current" : "border-2 border-current")} />;
}

/** Ambos lados reservan el mismo ancho, incluso cuando el puntaje es cero. */
export function Indicator({ kind, value }: { kind: Kind; value: number }) {
  return (
    <span
      role="img"
      aria-label={value + (kind === "exact" ? " en su lugar" : " en otro lugar")}
      className={cn("inline-flex w-8 shrink-0 items-center justify-center gap-1.5 font-bold tabular-nums", value === 0 ? "text-pencil/50" : "text-ink")}
    >
      <Symbol kind={kind} />
      <span aria-hidden>{value}</span>
    </span>
  );
}

export function PegLegend() {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Symbol kind="exact" /> en su lugar
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Symbol kind="present" /> está, en otro lugar
      </span>
    </p>
  );
}
