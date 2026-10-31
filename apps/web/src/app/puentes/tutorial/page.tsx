import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PuentesTutorial } from "@/games/puentes/tutorial";

export const metadata: Metadata = { title: "Tutorial de Puentes" };

export default function TutorialPage() {
  return (
    <>
      <SiteHeader game={{ name: "Puentes", href: "/puentes" }} />
      <PuentesTutorial />
    </>
  );
}
