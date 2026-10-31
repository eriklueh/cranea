import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PuentesHome } from "@/games/puentes/components/home";

export const metadata: Metadata = { title: "Puentes" };

export default function PuentesPage() {
  return (
    <>
      <SiteHeader game={{ name: "Puentes", href: "/puentes", current: true }} />
      <PuentesHome />
    </>
  );
}
