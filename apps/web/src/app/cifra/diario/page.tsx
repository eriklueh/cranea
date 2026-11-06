import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DailyFallback, DailyGame } from "./daily-game";

export const metadata: Metadata = { title: "Cifra del día" };

export default function DailyPage() {
  return (
    <>
      <SiteHeader game={{ name: "Cifra", href: "/cifra" }} />
      {/* DailyGame lee ?fecha= (diarios pasados) con useSearchParams. */}
      <Suspense fallback={<DailyFallback />}>
        <DailyGame />
      </Suspense>
    </>
  );
}
