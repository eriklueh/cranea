import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DailyGame } from "./daily-game";

export const metadata: Metadata = { title: "Nonograma del día" };

export default function DailyPage() {
  return (
    <>
      <SiteHeader game={{ name: "Nonograma", href: "/nonograma" }} />
      <DailyGame />
    </>
  );
}
