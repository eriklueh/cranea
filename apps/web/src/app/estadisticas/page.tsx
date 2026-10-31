import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { StatsView } from "@/components/stats-view";
import { GAMES } from "@/games/registry";

export const metadata: Metadata = { title: "Estadísticas" };

export default function StatsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 pt-4 pb-16 sm:pl-16">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Estadísticas</h1>
          <p className="mt-2 max-w-md text-muted-foreground">Tus partidas en este dispositivo y, con sesión iniciada, en tu cuenta.</p>
        </div>
        <StatsView games={GAMES.filter((g) => g.status === "live")} />
      </main>
    </>
  );
}
