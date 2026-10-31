import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AchievementsView } from "@/components/achievements-view";

export const metadata: Metadata = { title: "Logros" };

export default function AchievementsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 pt-4 pb-16 sm:pl-16">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Logros</h1>
          <p className="mt-2 max-w-md text-muted-foreground">Se guardan en este dispositivo y, con sesión iniciada, en tu cuenta.</p>
        </div>
        <AchievementsView />
      </main>
    </>
  );
}
