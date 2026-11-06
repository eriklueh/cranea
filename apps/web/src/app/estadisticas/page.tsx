import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { StatsHeader, StatsView } from "@/components/stats-view";
import { GAMES } from "@/games/registry";

export const metadata: Metadata = { title: "Estadísticas" };

export default function StatsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 pt-4 pb-16 sm:pl-16">
        <StatsHeader />
        <StatsView games={GAMES.filter((g) => g.status === "live")} />
      </main>
    </>
  );
}
