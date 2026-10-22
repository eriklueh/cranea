import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { DailyCard, WorldMap } from "@/games/cifra/components/world-map";

export const metadata: Metadata = { title: "Cifra" };

export default function CifraHome() {
  return (
    <>
      <SiteHeader>
        <span className="text-pencil">/</span>
        <span className="font-display text-xl font-bold">Cifra</span>
      </SiteHeader>
      <main className="mx-auto w-full max-w-3xl space-y-10 px-6 pt-4 pb-16 sm:pl-16">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="max-w-md text-muted-foreground">
            Cada tablero trae intentos ya puntuados. Cruzalos hasta que solo un código encaje.
          </p>
          <Link href="/cifra/como-jugar" className="font-semibold underline decoration-margin decoration-2 underline-offset-4">
            Cómo se juega
          </Link>
        </div>
        <DailyCard />
        <WorldMap />
      </main>
    </>
  );
}
