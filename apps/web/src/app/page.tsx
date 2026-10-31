import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GAMES } from "@/games/registry";
import { DailyBadge } from "@/components/game-home/daily-badge";
import { DigitTile } from "@/games/cifra/components/digit-tile";
import { Indicator } from "@/games/cifra/components/pegs";
import { PuentesPreview } from "@/games/puentes/components/preview";
import { NonogramaPreview } from "@/games/nonograma/components/preview";
import { PalabraPreview } from "@/games/palabra/components/preview";
import { TorresPreview } from "@/games/torres/components/preview";

function CifraPreview() {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      <Indicator kind="exact" value={1} />
      <span className="flex gap-1.5">
        {[4, 0, 7, 2].map((d, i) => (
          <DigitTile key={i} digit={d} size="sm" mark={d === 0 ? "out" : "none"} />
        ))}
      </span>
      <Indicator kind="present" value={2} />
    </div>
  );
}

/** Ilustración de cada juego en su tarjeta, por id. */
const PREVIEWS: Record<string, React.ComponentType> = {
  cifra: CifraPreview,
  puentes: PuentesPreview,
  nonograma: NonogramaPreview,
  palabra: PalabraPreview,
  torres: TorresPreview,
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 pt-2 pb-16 sm:pr-6 sm:pl-16 sm:pt-6">
        <h1 className="sr-only">Craneá: juegos de lógica</h1>
        <ul className="grid gap-3 sm:gap-4">
          {GAMES.map((g) => {
            const Preview = PREVIEWS[g.id];
            return (
            <li key={g.id}>
              <Link
                href={g.path}
                className="group block rounded-xl border-2 border-ink bg-card p-4 sm:p-5 shadow-[0_4px_0_0_var(--shadow-ink)] transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:justify-start">
                      <h2 className="font-display text-3xl font-extrabold">{g.name}</h2>
                      <DailyBadge gameId={g.id} />
                    </div>
                    <p className="mt-1 max-w-sm text-muted-foreground">{g.tagline}</p>
                  </div>
                  {Preview && <div className="self-center sm:self-auto"><Preview /></div>}
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
