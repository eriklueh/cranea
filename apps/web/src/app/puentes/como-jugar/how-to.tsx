"use client";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TryTutorial } from "@/components/tutorial/try-tutorial";
import { EXAMPLE_ROWS, EXAMPLE_SOLUTION, StaticBoard } from "@/games/puentes/components/preview";
import { useT } from "@/lib/i18n";

/** Reemplaza `{nombre}` por un nodo (los nombres de botones en negrita). */
function rich(text: string, parts: Record<string, ReactNode>) {
  return text.split(/\{(\w+)\}/g).map((piece, i) => <Fragment key={i}>{i % 2 ? (parts[piece] ?? piece) : piece}</Fragment>);
}

/** «Cómo se juega Puentes» en el idioma activo (la página es estática; el texto se cambia al hidratar). */
export function HowTo() {
  const t = useT();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("puentes.howToTitle")}</h1>
      <TryTutorial href="/puentes/tutorial" />
      <p className="max-w-prose">{t("puentes.howToIntro")}</p>
      <ul className="max-w-prose list-disc space-y-1 pl-5">
        <li>{t("puentes.howToRule1")}</li>
        <li>{t("puentes.howToRule2")}</li>
        <li>{t("puentes.howToRule3")}</li>
        <li>{t("puentes.howToRule4")}</li>
      </ul>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">{t("puentes.howToExampleTitle")}</h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <StaticBoard rows={EXAMPLE_ROWS} className="w-40" label={t("puentes.howToExampleEmpty")} />
          <StaticBoard rows={EXAMPLE_ROWS} bridges={EXAMPLE_SOLUTION} done={[0, 1, 2, 3]} className="w-40" label={t("puentes.howToExampleSolved")} />
        </div>
        <p className="max-w-prose">{t("puentes.howToExample")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">{t("puentes.howToBuildTitle")}</h2>
        <p className="max-w-prose">{rich(t("puentes.howToBuild"), { undo: <strong>{t("puentes.undo")}</strong>, reset: <strong>{t("puentes.reset")}</strong> })}</p>
        <p className="max-w-prose">{t("puentes.howToKeyboard")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">{t("puentes.howToCheckTitle")}</h2>
        <p className="max-w-prose">{rich(t("puentes.howToCheck"), { check: <strong>{t("puentes.check")}</strong> })}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">{t("puentes.howToWorldsTitle")}</h2>
        <p className="max-w-prose">{t("puentes.howToWorlds")}</p>
        <p className="max-w-prose">{t("puentes.howToDaily")}</p>
      </section>

      <Button asChild size="lg">
        <Link href="/puentes">{t("puentes.startPlaying")}</Link>
      </Button>
    </main>
  );
}
