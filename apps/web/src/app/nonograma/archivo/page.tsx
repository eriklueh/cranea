import type { Metadata } from "next";
import { ArchiveView } from "@/components/daily-hub/archive-view";
import { SiteHeader } from "@/components/site-header";
import { LAUNCH_DATE } from "@/games/nonograma/data";

export const metadata: Metadata = { title: "Nonograma: diarios anteriores" };

export default function ArchivePage() {
  return (
    <>
      <SiteHeader game={{ name: "Nonograma", href: "/nonograma" }} />
      <ArchiveView gameId="nonograma" home="/nonograma" launch={LAUNCH_DATE} />
    </>
  );
}
