import type { Metadata } from "next";
import { ArchiveView } from "@/components/daily-hub/archive-view";
import { SiteHeader } from "@/components/site-header";
import { LAUNCH_DATE } from "@/games/puentes/data";

export const metadata: Metadata = { title: "Puentes: diarios anteriores" };

export default function ArchivePage() {
  return (
    <>
      <SiteHeader game={{ name: "Puentes", href: "/puentes" }} />
      <ArchiveView gameId="puentes" home="/puentes" launch={LAUNCH_DATE} />
    </>
  );
}
