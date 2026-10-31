import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DailyGame } from "./daily-game";

export const metadata: Metadata = { title: "Puentes del día" };

export default function DailyPage() {
  return (
    <>
      <SiteHeader game={{ name: "Puentes", href: "/puentes" }} />
      <DailyGame />
    </>
  );
}
