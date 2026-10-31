import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ExampleLine } from "@/games/nonograma/components/example-line";
import { NonogramaPreview } from "@/games/nonograma/components/preview";

export const metadata: Metadata = { title: "Cómo se juega Nonograma" };

export default function HowTo() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Cómo se juega Nonograma</h1>
        <p className="max-w-prose">
          Cada fila y cada columna tiene números. Te dicen cuántas casillas seguidas van pintadas, en orden, y que entre un tramo y
          otro hay al menos una vacía. Un <strong>3 1</strong> es un tramo de tres, uno o más espacios, y uno suelto. Un 0 es una
          línea vacía. Cuando pintás todo lo que va, aparece un dibujo.
        </p>

        <div className="flex justify-center">
          <NonogramaPreview />
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Cómo se deduce</h2>
          <p className="max-w-prose">
            Mirá una línea por vez. Si un 4 entra en cinco casillas, empiece donde empiece, las tres del medio van pintadas:
          </p>
          <div className="space-y-2">
            <ExampleLine clue="4" cells="....." label="Un 4 en cinco casillas vacías" />
            <ExampleLine clue="4" cells=".sss." label="Las tres casillas del medio van pintadas" />
          </div>
          <p className="max-w-prose">
            Lo que descubrís en una fila te ayuda en las columnas que cruza, y al revés. Cuando una casilla seguro no va, ponele una
            cruz: también es información.
          </p>
          <div className="space-y-2">
            <ExampleLine clue="1 1" cells="#x..." label="Después de un tramo de uno completo va una cruz" />
          </div>
          <p className="max-w-prose">
            Ningún tablero necesita adivinar: todos tienen una sola solución y se resuelven mirando filas y columnas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Pintar, cruzar y arrastrar</h2>
          <ul className="max-w-prose list-disc space-y-1.5 pl-5">
            <li>Elegí <strong>Pintar</strong> o <strong>Cruz</strong> abajo del tablero y tocá una casilla.</li>
            <li>Arrastrá el dedo por una fila o una columna para marcar varias de una vez.</li>
            <li>Si empezás el trazo sobre una casilla que ya tiene eso, el trazo borra.</li>
            <li>Los números de una línea se apagan cuando lo pintado ya coincide con su pista.</li>
            <li><strong>Deshacer</strong> vuelve atrás un trazo; <strong>Borrar todo</strong> también se puede deshacer.</li>
          </ul>
          <p className="max-w-prose text-muted-foreground">
            Con teclado: flechas para moverte, Espacio o Enter para usar la herramienta, X para cruzar, C para cambiar de herramienta y
            U o Ctrl+Z para deshacer. Si mantenés la tecla y te movés, marcás un tramo. Con mouse, el clic derecho cruza.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Intentos</h2>
          <p className="max-w-prose">
            No hay vidas que se pierden por tocar mal: podés corregir todo lo que quieras. El tablero se completa solo cuando lo
            pintado coincide con el dibujo; las cruces son notas tuyas.
          </p>
          <p className="max-w-prose">
            Si te trabás, <strong>Revisar</strong> marca en rojo lo que está mal. Tenés dos revisiones y cada una suma un intento: sin
            revisar lo resolvés en 1, con una en 2, con dos en 3. Si preferís, <strong>Me rindo</strong> muestra la solución.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Mundos y diario</h2>
          <p className="max-w-prose">
            Hay tres mundos: dibujos de 5×5, de 10×10 y de 15×15, ordenados de más fácil a más difícil. Cada día hay un tablero de
            10×10 nuevo, el mismo para todos, que se juega una sola vez.
          </p>
        </section>

        <Button asChild size="lg">
          <Link href="/nonograma">Empezar a jugar</Link>
        </Button>
      </main>
    </>
  );
}
