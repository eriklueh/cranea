import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PlusFaq } from "@/components/plus/plus-faq";
import { PlusHero } from "@/components/plus/plus-hero";
import { PLUS_PRICE } from "@/lib/plus";

export const metadata: Metadata = {
  title: "Craneá Plus",
  description: `Todos los niveles, el archivo de diarios y pistas sin límite, ${PLUS_PRICE}. Los desafíos del día siguen gratis.`,
};

export default function PlusPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-5 pt-1 pb-16">
        <PlusHero />
        <PlusFaq />
      </main>
    </>
  );
}
