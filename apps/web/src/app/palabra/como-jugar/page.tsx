import type { Metadata } from "next";
import Link from "next/link";
import type { Clue } from "@cranea/core/palabra";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ScoreLegend } from "@/games/palabra/components/legend";
import { WordRow } from "@/games/palabra/components/word-row";

export const metadata: Metadata = { title: "Cómo se juega Palabra" };

const example: Clue[] = [
  { word: "pulpo", scores: [2, 0, 2, 0, 0] },
  { word: "manta", scores: [0, 2, 0, 2, 2] },
];

const repeated: Clue[] = [{ word: "error", scores: [1, 1, 2, 1, 0] }];

export default function HowTo() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Cómo se juega Palabra</h1>
        <p className="max-w-prose">
          Hay una palabra oculta de cinco letras. El tablero ya trae algunas palabras probadas y puntuadas: cada letra te dice si
          está en su lugar, si está en otro lugar o si no está. Cruzando las filas, una sola palabra encaja con todas. Tenés tres
          intentos para escribirla.
        </p>

        <div className="space-y-3">
          <ol className="space-y-2.5">
            {example.map((c, i) => (
              <WordRow key={i} clue={c} />
            ))}
          </ol>
          <ScoreLegend />
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Cómo se resuelve este</h2>
          <p className="max-w-prose">
            PULPO deja la P primera y la L en el medio. MANTA pone una A segunda, la T cuarta y otra A al final. Ya están las
            cinco letras en su lugar: P, A, L, T, A. La palabra es PALTA.
          </p>
          <p className="max-w-prose">
            Todas las letras de la palabra oculta aparecen en las pistas, en verde o en amarillo. No hace falta adivinar una letra
            que nunca viste: alcanza con ubicar las que ya conocés.
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
            última sale gris: PERRO no tiene una tercera R. Cada letra amarilla o verde corresponde a una letra distinta de la
            palabra oculta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Qué palabras valen</h2>
          <ul className="max-w-prose list-disc space-y-1 pl-5">
            <li>La palabra oculta es común: un sustantivo, un adjetivo o un verbo sin conjugar. Nunca un plural.</li>
            <li>Las tildes no cuentan: ÁRBOL se escribe ARBOL. La Ñ es una letra aparte.</li>
            <li>Tus intentos tienen que ser palabras del diccionario del juego. Si no está, no gastás intento.</li>
            <li>Podés usar el teclado de la pantalla o el de tu computadora. Enter prueba la palabra y Borrar quita una letra.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Los mundos y el diario</h2>
          <p className="max-w-prose">
            Cada mundo te da menos ayuda: primero muchas letras ya en su lugar, después casi todas amarillas y al final tres filas
            para cruzar a la vez. La palabra del día es la misma para todos y se juega una sola vez.
          </p>
        </section>

        <Button asChild size="lg">
          <Link href="/palabra">Empezar a jugar</Link>
        </Button>
      </main>
    </>
  );
}
