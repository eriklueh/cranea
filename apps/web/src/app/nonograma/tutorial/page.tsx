import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { NonogramaTutorial } from "@/games/nonograma/tutorial";

export const metadata: Metadata = { title: "Tutorial de Nonograma" };

export default function TutorialPage() {
  return (
    <>
      <SiteHeader game={{ name: "Nonograma", href: "/nonograma" }} />
      <NonogramaTutorial />
    </>
  );
}
