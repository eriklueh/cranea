import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PalabraHome } from "@/games/palabra/components/home";

export const metadata: Metadata = { title: "Palabra" };

export default function PalabraPage() {
  return (
    <>
      <SiteHeader />
      <PalabraHome />
    </>
  );
}
