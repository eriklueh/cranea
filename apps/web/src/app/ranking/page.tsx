import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { RankingHeader, RankingView } from "@/components/ranking-view";
import { GAMES } from "@/games/registry";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 pt-4 pb-16 sm:pl-16">
        <RankingHeader />
        <Suspense>
          <RankingView games={GAMES.filter((g) => g.status === "live")} />
        </Suspense>
      </main>
    </>
  );
}
