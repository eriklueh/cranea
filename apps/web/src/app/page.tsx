import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GAMES } from "@/games/registry";
import { DigitTile } from "@/games/cifra/components/digit-tile";
import { Indicator } from "@/games/cifra/components/pegs";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-16 sm:pl-16">
        <section className="pt-10 pb-12">
          <h1 className="font-display text-6xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl">
            Craneá
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Juegos de lógica cortos para pensar un rato. Uno por día, o todos los que quieras.
          </p>
        </section>

        <h2 className="sr-only">Juegos</h2>
        <ul className="grid gap-4">
          {GAMES.map((g) => (
            <li key={g.id}>
              <Link
                href={g.path}
                className="group block rounded-xl border-2 border-ink bg-card p-5 shadow-[0_4px_0_0_var(--shadow-ink)] transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
              >
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <h3 className="font-display text-3xl font-extrabold">{g.name}</h3>
                    <p className="mt-1 max-w-sm text-muted-foreground">{g.tagline}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2" aria-hidden>
                    <Indicator kind="exact" value={1} />
                    <span className="flex gap-1.5">
                      {[4, 0, 7, 2].map((d, i) => (
                        <DigitTile key={i} digit={d} size="sm" mark={d === 0 ? "out" : "none"} />
                      ))}
                    </span>
                    <Indicator kind="present" value={2} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
          <li className="rounded-xl border-2 border-dashed border-pencil/50 p-5 text-muted-foreground">
            El próximo juego está en camino.
          </li>
        </ul>
      </main>
    </>
  );
}
