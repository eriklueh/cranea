"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TryTutorial } from "@/components/tutorial/try-tutorial";
import { Board } from "@/games/torres/components/board";
import { TorresPreview } from "@/games/torres/components/preview";
import { useLocale, useT } from "@/lib/i18n";

// Ejemplo de 4×4 con todas sus pistas, resuelto.
const SOLUTION = [2, 1, 4, 3, 3, 4, 1, 2, 4, 2, 3, 1, 1, 3, 2, 4];
const CLUES = { top: [3, 2, 1, 2], bottom: [2, 2, 3, 1], left: [2, 2, 1, 3], right: [2, 2, 3, 1] };
const EMPTY = new Array<number>(16).fill(0);

const Example = () => <Board size={4} clues={CLUES} givens={EMPTY} values={SOLUTION} readOnly className="max-w-72" />;

/** «Cómo se juega» en el idioma activo (la página se prerenderiza en español). */
export function HowToBody() {
  const t = useT();
  const locale = useLocale();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("torres.howToTitle")}</h1>
      <TryTutorial href="/torres/tutorial" />
      {locale === "en" ? <English /> : <Spanish />}
      <Button asChild size="lg">
        <Link href="/torres">{t("torres.startPlaying")}</Link>
      </Button>
    </main>
  );
}

function Spanish() {
  return (
    <>
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
        <Example />
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
    </>
  );
}

function English() {
  return (
    <>
      <p className="max-w-prose">
        Each square is a tower. On a four-by-four board, heights go from 1 to 4, and every row and every column has each height
        exactly once. The numbers on the edge tell you how many towers you can see looking in from that side: a tall tower hides
        any shorter ones behind it.
      </p>

      <div className="space-y-3">
        <TorresPreview className="justify-center" />
        <p className="text-center text-sm text-muted-foreground">
          From the left you see the 2 and the 4; the 1 is hidden. From the right, the 3 and the 4.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">A finished board</h2>
        <Example />
        <p className="max-w-prose">
          When a row or column satisfies its clue, the number turns green. If what you wrote can no longer satisfy it, it turns
          red. Repeated heights in a row or column are marked in red too.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Where to start</h2>
        <ul className="max-w-prose list-disc space-y-1.5 pl-5">
          <li>A 1 on the edge: the tallest tower sits right next to that side.</li>
          <li>A 4 on the edge (or the board size): the towers climb one step at a time, 1, 2, 3, 4.</li>
          <li>The bigger the clue, the farther from the edge the tallest tower has to be.</li>
          <li>When you get stuck, look at a row with both of its clues and try where the tallest can go.</li>
        </ul>
        <p className="max-w-prose">
          Some boards come with given squares, marked with a small line underneath. None of them need guessing: there&apos;s always
          a deduction to make.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Notes, undo and check</h2>
        <p className="max-w-prose">
          Tap a square and pick a height. With <strong>Notes</strong> on, numbers are jotted down small as candidates. On a
          keyboard: arrows to move, numbers to write, Shift + number or the N key for notes, Backspace to clear and Ctrl + Z to
          undo.
        </p>
        <p className="max-w-prose">
          <strong>Check</strong> reviews what you wrote. If everything is right, it costs nothing. If some squares are wrong,
          they&apos;re marked and you use up a try: you have three. Fill the board with no conflicts and the city is solved. Your
          tries are one plus your failed checks.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Worlds and the daily</h2>
        <p className="max-w-prose">
          You start at four by four and work up to seven by seven. Each world asks a bit more: reading the clues, then working
          through a whole row with both its clues, and finally assuming a height to see if everything falls apart. The daily is
          five by five, the same for everyone, and you play it once a day.
        </p>
      </section>
    </>
  );
}
