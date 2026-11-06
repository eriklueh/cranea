"use client";
import { LetterTile } from "@/games/palabra/components/letter-tile";
import { Indicator } from "@/games/cifra/components/pegs";
import { useT } from "@/lib/i18n";

const WORD = [
  { letter: "c", tone: "exact" },
  { letter: "r", tone: "present" },
  { letter: "a", tone: "absent" },
  { letter: "n", tone: "exact" },
  { letter: "e", tone: "present" },
] as const;

/** Muestra en vivo cómo se ven las pistas con la paleta, el tema y la letra elegidos (usa las fichas reales). */
export function TilePreview() {
  const t = useT();
  return (
    <figure aria-label={t("shell.tilePreview")} className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-pencil/50 bg-paper px-2 py-3">
      <div className="flex gap-1">
        {WORD.map(({ letter, tone }, i) => <LetterTile key={i} letter={letter} tone={tone} size="sm" />)}
      </div>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 text-clue-exact"><Indicator kind="exact" value={2} /> {t("shell.tileExact")}</span>
        <span className="inline-flex items-center gap-1.5 text-clue-present"><Indicator kind="present" value={2} /> {t("shell.tilePresent")}</span>
      </figcaption>
    </figure>
  );
}
