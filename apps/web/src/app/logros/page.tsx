import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AchievementsHeader, AchievementsView } from "@/components/achievements-view";

export const metadata: Metadata = { title: "Logros" };

export default function AchievementsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 pt-4 pb-16 sm:pl-16">
        <AchievementsHeader />
        <AchievementsView />
      </main>
    </>
  );
}
