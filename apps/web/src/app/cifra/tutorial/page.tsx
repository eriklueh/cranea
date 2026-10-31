import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CifraTutorial } from "@/games/cifra/tutorial";

export const metadata: Metadata = { title: "Tutorial de Cifra" };

export default function TutorialPage() {
  return (
    <>
      <SiteHeader game={{ name: "Cifra", href: "/cifra" }} />
      <CifraTutorial />
    </>
  );
}
