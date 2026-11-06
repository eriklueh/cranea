"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TryTutorial } from "@/components/tutorial/try-tutorial";
import { ClueRow } from "@/games/cifra/components/clue-row";
import { PegLegend } from "@/games/cifra/components/pegs";
import { MarkLegend } from "@/games/cifra/components/mark-legend";
import { useT } from "@/lib/i18n";

const example = [
  { guess: [1, 0, 7], feedback: { exact: 0, present: 3 } },
  { guess: [0, 7, 1], feedback: { exact: 0, present: 3 } },
];

/** «Cómo se juega Cifra» en el idioma activo (la página es estática; el texto se cambia al hidratar). */
export function HowTo() {
  const t = useT();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("cifra.howToTitle")}</h1>
      <TryTutorial href="/cifra/tutorial" />
      <p className="max-w-prose">{t("cifra.howToIntro")}</p>

      <div className="space-y-3">
        <ol className="space-y-2.5">
          {example.map((c, i) => (
            <ClueRow key={i} clue={c} />
          ))}
        </ol>
        <PegLegend />
        <p className="text-center text-sm text-muted-foreground">{t("cifra.howToPegs")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">{t("cifra.howToSolveTitle")}</h2>
        <p className="max-w-prose">{t("cifra.howToSolve")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">{t("cifra.howToMarksTitle")}</h2>
        <MarkLegend />
        <p className="max-w-prose">{t("cifra.howToMarks")}</p>
        <p className="max-w-prose">{t("cifra.howToNotes")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">{t("cifra.howToWorldsTitle")}</h2>
        <p className="max-w-prose">{t("cifra.howToWorlds")}</p>
      </section>

      <Button asChild size="lg">
        <Link href="/cifra">{t("cifra.startPlaying")}</Link>
      </Button>
    </main>
  );
}
