"use client";
import { useT } from "@/lib/i18n";
import { DigitTile } from "./digit-tile";

export function MarkLegend() {
  const t = useT();
  return (
    <div className="space-y-2 text-center text-sm text-muted-foreground">
      <p>{t("cifra.markLegend")}</p>
      <div className="flex items-center justify-center gap-4">
        {([
          ["out", "cifra.markOut"],
          ["in", "cifra.markIn"],
          ["here", "cifra.markHere"],
        ] as const).map(([mark, label]) => (
          <span key={mark} className="inline-flex items-center gap-1.5">
            <span aria-hidden><DigitTile digit={5} mark={mark} size="sm" className="size-8 text-base" /></span>
            {t(label)}
          </span>
        ))}
      </div>
    </div>
  );
}
