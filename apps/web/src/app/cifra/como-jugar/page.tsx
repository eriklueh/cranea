import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { HowTo } from "./how-to";

export const metadata: Metadata = { title: "Cómo se juega Cifra" };

export default function HowToPage() {
  return (
    <>
      <SiteHeader game={{ name: "Cifra", href: "/cifra" }} />
      <HowTo />
    </>
  );
}
