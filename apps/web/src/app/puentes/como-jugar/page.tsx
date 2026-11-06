import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { HowTo } from "./how-to";

export const metadata: Metadata = { title: "Cómo se juega Puentes" };

export default function HowToPage() {
  return (
    <>
      <SiteHeader game={{ name: "Puentes", href: "/puentes" }} />
      <HowTo />
    </>
  );
}
