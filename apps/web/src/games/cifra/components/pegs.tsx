"use client";
import type { CSSProperties } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Kind = "exact" | "present";

function Symbol({ kind }: { kind: Kind }) {
  return <span aria-hidden className={cn("size-3 shrink-0 rounded-full", kind === "exact" ? "bg-current" : "border-2 border-current")} />;
}

/** Ambos lados reservan el mismo ancho, incluso cuando el puntaje es cero. */
export function Indicator({ kind, value, className, style }: { kind: Kind; value: number; className?: string; style?: CSSProperties }) {
  const t = useT();
  return (
    <span
      role="img"
      aria-label={t(kind === "exact" ? "cifra.exactLabel" : "cifra.presentLabel", { n: value })}
      style={style}
      className={cn("inline-flex h-7 w-8 shrink-0 items-center justify-center gap-1.5 rounded-md font-bold tabular-nums", kind === "exact" ? "bg-clue-exact-bg text-clue-exact" : "bg-clue-present-bg text-clue-present", value === 0 && "opacity-50", className)}
    >
      <Symbol kind={kind} />
      <span aria-hidden>{value}</span>
    </span>
  );
}

export function PegLegend() {
  const t = useT();
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 text-clue-exact">
        <Symbol kind="exact" /> {t("cifra.legendExact")}
      </span>
      <span className="inline-flex items-center gap-1.5 text-clue-present">
        <Symbol kind="present" /> {t("cifra.legendPresent")}
      </span>
    </p>
  );
}
