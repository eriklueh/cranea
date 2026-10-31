import type { Metadata } from "next";
import Link from "next/link";
import type { Clue } from "@cranea/core/palabra";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ScoreLegend } from "@/games/palabra/components/legend";
import { WordRow } from "@/games/palabra/components/word-row";

export const metadata: Metadata = { title: "Cómo se juega Palabra" };

// La palabra oculta del ejemplo es PALTA.
const example: Clue[] = [
  { word: "pulpo", scores: [2, 0, 2, 0, 0] },
  { word: "manta", scores: [0, 2, 0, 2, 2] },
  { word: "palta", scores: [2, 2, 2, 2, 2] },
];

const repeated: Clue[] = [{ word: "error", scores: [1, 1, 2, 1, 0] }];

export default function HowTo() {
  return (
    <>
      <SiteHeader game={{ name: "Palabra", href: "/palabra" }} />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-5 pt-4 pb-16 leading-relaxed sm:pl-16">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Cómo se juega Palabra</h1>
        <p className="max-w-prose">
          Hay una palabra oculta de cinco letras. Escribí cualquier palabra y probala: cada letra se pinta para decirte si está en
          su lugar, si está en otro lugar o si no está. Con esas pistas elegí el próximo intento, hasta encontrarla.
        </p>

        <div className="space-y-3">
          <ol className="space-y-2">
            {example.map((c, i) => (
              <WordRow key={i} clue={c} />
            ))}
          </ol>
          <ScoreLegend />
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Cómo se resolvió este</h2>
          <p className="max-w-prose">
            PULPO dejó la P primera y la L en el medio. MANTA sumó una A segunda, la T cuarta y otra A al final. Con las cinco
            letras ubicadas, el tercer intento fue PALTA.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Letras repetidas</h2>
          <ol>
            {repeated.map((c, i) => (
              <WordRow key={i} clue={c} />
            ))}
          </ol>
          <p className="max-w-prose">
            Si la palabra fuera PERRO, al probar ERROR la R del medio queda en su lugar, la primera R está pero en otro lugar y la
            última sale gris: PERRO no tiene una tercera R.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Qué palabras valen</h2>
          <ul className="max-w-prose list-disc space-y-1 pl-5">
            <li>La palabra oculta es común: un sustantivo, un adjetivo o un verbo sin conjugar. Nunca un plural.</li>
            <li>Las tildes no cuentan: ÁRBOL se escribe ARBOL. La Ñ es una letra aparte.</li>
            <li>Tus intentos tienen que ser palabras del diccionario del juego. Si no está, no gastás intento.</li>
            <li>El teclado de la pantalla se pinta con lo que ya descubriste.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Los mundos y el diario</h2>
          <p className="max-w-prose">
            En el primer mundo tenés seis intentos; después, cinco y cuatro. El último es el modo difícil: cada letra que
            descubrís la tenés que usar en el intento siguiente, y las verdes no se mueven de su lugar. La palabra del día es la
            misma para todos, con seis intentos, y se juega una sola vez.
          </p>
        </section>

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/palabra">Empezar a jugar</Link>
        </Button>
      </main>
    </>
  );
}
