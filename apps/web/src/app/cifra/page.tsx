import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CifraHome } from "@/games/cifra/components/home";

export const metadata: Metadata = { title: "Cifra" };

export default function CifraPage() {
  return (
    <>
      <SiteHeader game={{ name: "Cifra", href: "/cifra", current: true }} />
      <CifraHome />
    </>
  );
}
