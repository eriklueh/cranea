import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Board } from "@/games/torres/components/board";
import { TorresPreview } from "@/games/torres/components/preview";

export const metadata: Metadata = { title: "Cómo se juega Torres" };

// Ejemplo de 4×4 con todas sus pistas, resuelto.
const SOLUTION = [2, 1, 4, 3, 3, 4, 1, 2, 4, 2, 3, 1, 1, 3, 2, 4];
const CLUES = { top: [3, 2, 1, 2], bottom: [2, 2, 3, 1], left: [2, 2, 1, 3], right: [2, 2, 3, 1] };
const EMPTY = new Array<number>(16).fill(0);

export default function HowTo() {
  return (
    <>
      <SiteHeader game={{ name: "Torres", href: "/torres" }} />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Cómo se juega Torres</h1>
        <p className="max-w-prose">
          Cada casilla es una torre. En un tablero de cuatro por cuatro las alturas van del 1 al 4, y cada fila y cada columna
          tiene todas las alturas una sola vez. Los números del borde dicen cuántas torres se ven mirando desde ese lado: una torre
          alta tapa a las más bajas que tiene atrás.
        </p>

        <div className="space-y-3">
          <TorresPreview className="justify-center" />
          <p className="text-center text-sm text-muted-foreground">
            Desde la izquierda se ven el 2 y el 4; el 1 queda tapado. Desde la derecha, el 3 y el 4.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Un tablero completo</h2>
          <Board size={4} clues={CLUES} givens={EMPTY} values={SOLUTION} readOnly className="max-w-72" />
          <p className="max-w-prose">
            Cuando una fila o columna confirma su pista, el número se pinta de verde. Si lo que escribiste ya no puede cumplirla,
            se pinta de rojo. Las alturas repetidas en una fila o columna también se marcan en rojo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Por dónde empezar</h2>
          <ul className="max-w-prose list-disc space-y-1.5 pl-5">
            <li>Un 1 en el borde: la torre más alta va pegada a ese lado.</li>
            <li>Un 4 en el borde (o el tamaño del tablero): las torres suben de a una, 1, 2, 3, 4.</li>
            <li>Cuanto más grande es la pista, más lejos del borde tiene que estar la torre más alta.</li>
            <li>Cuando se traba, mirá una fila con sus dos pistas y probá dónde puede ir la más alta.</li>
          </ul>
          <p className="max-w-prose">
            Algunos tableros traen casillas dadas, con una rayita abajo. Ninguno necesita adivinar: siempre hay una deducción
            posible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Notas, deshacer y comprobar</h2>
          <p className="max-w-prose">
            Tocá una casilla y elegí la altura. Con <strong>Notas</strong> activado, los números se anotan chiquitos como
            candidatos. Con teclado: flechas para moverte, números para escribir, Shift + número o la tecla N para notas, Borrar
            para vaciar y Ctrl + Z para deshacer.
          </p>
          <p className="max-w-prose">
            <strong>Comprobar</strong> revisa lo que escribiste. Si todo está bien, no cuesta nada. Si hay casillas equivocadas, se
            marcan y gastás un intento: tenés tres. Al llenar el tablero sin conflictos, la ciudad queda resuelta. Tus intentos son
            uno más las comprobaciones fallidas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Los mundos y el diario</h2>
          <p className="max-w-prose">
            Se empieza en cuatro por cuatro y se llega a siete por siete. Cada mundo pide un poco más: leer las pistas, después
            cruzar una fila entera con sus dos pistas, y al final suponer una altura para ver si todo se contradice. El diario es
            de cinco por cinco, el mismo para todos, y se juega una vez por día.
          </p>
        </section>

        <Button asChild size="lg">
          <Link href="/torres">Empezar a jugar</Link>
        </Button>
      </main>
    </>
  );
}
