import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DailyGame } from "./daily-game";

export const metadata: Metadata = { title: "Puentes del día" };

export default function DailyPage() {
  return (
    <>
      <SiteHeader game={{ name: "Puentes", href: "/puentes" }} />
      {/* DailyGame lee ?fecha= (diarios pasados) con useSearchParams. */}
      <Suspense fallback={<main className="mx-auto w-full max-w-md px-4 pt-4 text-muted-foreground" aria-busy>Preparando el tablero…</main>}>
        <DailyGame />
      </Suspense>
    </>
  );
}
