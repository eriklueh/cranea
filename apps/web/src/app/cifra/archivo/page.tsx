import type { Metadata } from "next";
import { ArchiveView } from "@/components/daily-hub/archive-view";
import { SiteHeader } from "@/components/site-header";
import { LAUNCH_DATE } from "@/games/cifra/data";

export const metadata: Metadata = { title: "Cifra: diarios anteriores" };

export default function ArchivePage() {
  return (
    <>
      <SiteHeader game={{ name: "Cifra", href: "/cifra" }} />
      <ArchiveView gameId="cifra" home="/cifra" launch={LAUNCH_DATE} />
    </>
  );
}
