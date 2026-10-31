import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { NonogramaHome } from "@/games/nonograma/components/home";

export const metadata: Metadata = { title: "Nonograma" };

export default function NonogramaPage() {
  return (
    <>
      <SiteHeader />
      <NonogramaHome />
    </>
  );
}
