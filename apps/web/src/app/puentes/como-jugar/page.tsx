import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { TryTutorial } from "@/components/tutorial/try-tutorial";
import { EXAMPLE_ROWS, EXAMPLE_SOLUTION, StaticBoard } from "@/games/puentes/components/preview";

export const metadata: Metadata = { title: "Cómo se juega Puentes" };

export default function HowTo() {
  return (
    <>
      <SiteHeader game={{ name: "Puentes", href: "/puentes" }} />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-6 pt-4 pb-16 leading-relaxed sm:pl-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Cómo se juega Puentes</h1>
        <TryTutorial href="/puentes/tutorial" />
        <p className="max-w-prose">
          Cada círculo es una isla y su número dice cuántos puentes salen de ella. Uní las islas con puentes rectos, en horizontal o
          en vertical, hasta que todas queden conectadas en un solo grupo.
        </p>
        <ul className="max-w-prose list-disc space-y-1 pl-5">
          <li>Entre dos islas puede haber uno o dos puentes, nunca más.</li>
          <li>Los puentes no se cruzan ni pasan por encima de otra isla.</li>
          <li>Cada isla tiene que tener exactamente los puentes que pide su número.</li>
          <li>Todas las islas tienen que quedar unidas: desde cualquiera se llega a cualquier otra.</li>
        </ul>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Un ejemplo</h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <StaticBoard rows={EXAMPLE_ROWS} className="w-40" label="Tablero de ejemplo sin puentes" />
            <StaticBoard rows={EXAMPLE_ROWS} bridges={EXAMPLE_SOLUTION} done={[0, 1, 2, 3]} className="w-40" label="El mismo tablero resuelto" />
          </div>
          <p className="max-w-prose">
            El 4 de la esquina solo ve dos islas, y a cada una le puede tender dos puentes como máximo: necesita los dos dobles. Con
            eso el 2 ya está completo y no puede bajar hacia el 1. Entonces el 1 se une con el 3, que llega a sus tres puentes. Cuando
            una isla está completa se pinta de verde.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Cómo se tienden</h2>
          <p className="max-w-prose">
            Deslizá el dedo desde una isla hacia una vecina, o tocá una isla y después la otra. Tocar un puente suma el segundo, y
            un tercer toque lo saca. <strong>Deshacer</strong> vuelve un paso atrás y <strong>Empezar de nuevo</strong> saca todos
            los puentes (también se puede deshacer).
          </p>
          <p className="max-w-prose">
            Con teclado: Tab llega al tablero, las flechas te mueven entre islas y Mayús + flecha tiende un puente hacia ese lado.
            Enter elige una isla para unirla con otra. Ctrl + Z deshace.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Revisar y errores</h2>
          <p className="max-w-prose">
            <strong>Revisar</strong> marca en rojo los puentes que sobran. Si encuentra alguno, suma un error; si todo lo que tendiste
            está bien, te dice cuántos faltan sin sumar nada. Un puente que cruzaría a otro no se tiende y no cuenta como error.
            El tablero se resuelve solo cuando todo encaja. Tus intentos son 1 más los errores: resolverlo sin errores vale tres
            puntitos en el mapa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Los mundos</h2>
          <p className="max-w-prose">
            Primero alcanza con contar lo que le falta a cada isla. Después hay que cuidar que ningún grupo quede aislado: por
            ejemplo, dos islas con un 1 no pueden unirse entre sí. Al final, en mapas grandes, conviene suponer un puente y ver si
            todo se contradice. Cada tablero tiene una sola solución y ninguno necesita adivinar.
          </p>
          <p className="max-w-prose">
            El mapa del día es el mismo para todos y se juega una vez.
          </p>
        </section>

        <Button asChild size="lg">
          <Link href="/puentes">Empezar a jugar</Link>
        </Button>
      </main>
    </>
  );
}
