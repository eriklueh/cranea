import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PalabraTutorial } from "@/games/palabra/tutorial";

export const metadata: Metadata = { title: "Tutorial de Palabra" };

export default function TutorialPage() {
  return (
    <>
      <SiteHeader game={{ name: "Palabra", href: "/palabra" }} />
      <PalabraTutorial />
    </>
  );
}
