import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { HowToBody } from "./how-to";

export const metadata: Metadata = { title: "Cómo se juega Torres" };

export default function HowTo() {
  return (
    <>
      <SiteHeader game={{ name: "Torres", href: "/torres" }} />
      <HowToBody />
    </>
  );
}
