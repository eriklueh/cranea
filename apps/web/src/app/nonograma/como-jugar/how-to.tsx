"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TryTutorial } from "@/components/tutorial/try-tutorial";
import { ExampleLine } from "@/games/nonograma/components/example-line";
import { NonogramaPreview } from "@/games/nonograma/components/preview";
import { useLocale, useT, type T } from "@/lib/i18n";

/** «Cómo se juega» en el idioma activo (la página se prerenderiza en español). */
export function HowToBody() {
  const t = useT();
  const locale = useLocale();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("nonograma.howToTitle")}</h1>
      <TryTutorial href="/nonograma/tutorial" />
      {locale === "en" ? <English t={t} /> : <Spanish t={t} />}
      <Button asChild size="lg">
        <Link href="/nonograma">{t("nonograma.startPlaying")}</Link>
      </Button>
    </main>
  );
}

const Middle = ({ t }: { t: T }) => (
  <div className="space-y-2">
    <ExampleLine clue="4" cells="....." label={t("nonograma.exampleEmpty")} />
    <ExampleLine clue="4" cells=".sss." label={t("nonograma.exampleMiddle")} />
  </div>
);

const Cross = ({ t }: { t: T }) => (
  <div className="space-y-2">
    <ExampleLine clue="1 1" cells="#x..." label={t("nonograma.exampleCross")} />
  </div>
);

function Spanish({ t }: { t: T }) {
  return (
    <>
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
        <Middle t={t} />
        <p className="max-w-prose">
          Lo que descubrís en una fila te ayuda en las columnas que cruza, y al revés. Cuando una casilla seguro no va, ponele una
          cruz: también es información.
        </p>
        <Cross t={t} />
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
    </>
  );
}

function English({ t }: { t: T }) {
  return (
    <>
      <p className="max-w-prose">
        Every row and every column has numbers. They tell you how many squares in a row are filled, in order, with at least one
        empty square between one run and the next. A <strong>3 1</strong> is a run of three, one or more gaps, and a single one.
        A 0 is an empty line. Fill in everything that belongs and a picture appears.
      </p>

      <div className="flex justify-center">
        <NonogramaPreview />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">How to work it out</h2>
        <p className="max-w-prose">
          Look at one line at a time. If a 4 has to fit in five squares, wherever it starts, the middle three are filled:
        </p>
        <Middle t={t} />
        <p className="max-w-prose">
          What you find in a row helps with the columns it crosses, and the other way around. When a square definitely stays
          empty, give it a cross: that&apos;s information too.
        </p>
        <Cross t={t} />
        <p className="max-w-prose">
          No board needs guessing: each has exactly one solution and can be solved by looking at rows and columns.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Fill, cross and drag</h2>
        <ul className="max-w-prose list-disc space-y-1.5 pl-5">
          <li>Pick <strong>Fill</strong> or <strong>Cross</strong> under the board and tap a square.</li>
          <li>Drag your finger along a row or column to mark several at once.</li>
          <li>If you start a stroke on a square that already has that mark, the stroke erases.</li>
          <li>A line&apos;s numbers fade once what you filled matches its clue.</li>
          <li><strong>Undo</strong> takes back one stroke; <strong>Clear all</strong> can be undone too.</li>
        </ul>
        <p className="max-w-prose text-muted-foreground">
          On a keyboard: arrows to move, Space or Enter to use the tool, X to cross, C to switch tools and U or Ctrl+Z to undo.
          Hold the key while moving to mark a run. With a mouse, right-click crosses.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Tries</h2>
        <p className="max-w-prose">
          There are no lives to lose for a wrong tap: you can fix anything you want. The board is complete only when what you
          filled matches the picture; crosses are just your notes.
        </p>
        <p className="max-w-prose">
          If you get stuck, <strong>Check</strong> marks mistakes in red. You get two checks and each one adds a try: solve it
          without checking in 1, with one check in 2, with two in 3. If you&apos;d rather, <strong>I give up</strong> shows the
          solution.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Worlds and the daily</h2>
        <p className="max-w-prose">
          There are three worlds: 5×5, 10×10 and 15×15 pictures, from easiest to hardest. Every day there&apos;s a new 10×10
          board, the same for everyone, that you play once.
        </p>
      </section>
    </>
  );
}
