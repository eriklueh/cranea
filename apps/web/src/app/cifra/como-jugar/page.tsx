import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ClueRow } from "@/games/cifra/components/clue-row";
import { PegLegend } from "@/games/cifra/components/pegs";
import { MarkLegend } from "@/games/cifra/components/mark-legend";

export const metadata: Metadata = { title: "Cómo se juega Cifra" };

const example = [
  { guess: [1, 0, 7], feedback: { exact: 0, present: 3 } },
  { guess: [0, 7, 1], feedback: { exact: 0, present: 3 } },
];

export default function HowTo() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Cómo se juega Cifra</h1>
        <p className="max-w-prose">
          Hay un código secreto de cifras distintas. El tablero ya trae varios intentos puntuados. Cada fila te dice cuántas de sus
          cifras están en el código y cuántas están en su lugar, pero nunca cuáles. Cruzando las filas, solo un código encaja con
          todas. Todas las cifras del código aparecen entre las pistas. Tenés tres intentos para escribirlo.
        </p>

        <div className="space-y-3">
          <ol className="space-y-2.5">
            {example.map((c, i) => (
              <ClueRow key={i} clue={c} />
            ))}
          </ol>
          <PegLegend />
          <p className="text-center text-sm text-muted-foreground">A la izquierda, el círculo lleno cuenta las cifras en su lugar. A la derecha, el aro cuenta las que están en otro lugar.</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Cómo se resuelve este</h2>
          <p className="max-w-prose">
            El aro con un 3 indica que las tres cifras están en el código, pero ninguna en su lugar. Cruzá sus posiciones:
            el 7 no puede ir último por la primera fila, ni en el medio por la segunda, así que va primero. El 1 no puede ir
            primero ni último: va en el medio. El 0 ocupa el lugar que queda. El código es 710.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Marcá tus deducciones</h2>
          <MarkLegend />
          <p className="max-w-prose">
            La raya la descarta, el aro indica que va en el código y el fondo sólido confirma que va ahí. Un cuarto toque la deja
            sin marcar. Cada casilla se marca por separado: tocar una ficha no cambia ninguna otra, aunque tengan la misma cifra
            o estén en la misma columna.
          </p>
          <p className="max-w-prose">
            Las marcas son tus notas: no completan el código ni descartan otras cifras automáticamente. También podés recorrer las
            fichas con Tab y cambiar sus marcas con Enter o Espacio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Los mundos</h2>
          <p className="max-w-prose">
            Cada mundo pide una técnica más. Primero las filas que se leen solas, después contar lo que ya sabés de cada fila, y al
            final suponer una cifra en un lugar para ver si todo se contradice. Ningún tablero necesita adivinar.
          </p>
        </section>

        <Button asChild size="lg">
          <Link href="/cifra">Empezar a jugar</Link>
        </Button>
      </main>
    </>
  );
}
