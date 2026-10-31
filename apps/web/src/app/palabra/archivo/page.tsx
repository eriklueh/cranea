import type { Metadata } from "next";
import { ArchiveView } from "@/components/daily-hub/archive-view";
import { SiteHeader } from "@/components/site-header";
import { LAUNCH_DATE } from "@/games/palabra/data";

export const metadata: Metadata = { title: "Palabra: diarios anteriores" };

export default function ArchivePage() {
  return (
    <>
      <SiteHeader game={{ name: "Palabra", href: "/palabra" }} />
      <ArchiveView gameId="palabra" home="/palabra" launch={LAUNCH_DATE} />
    </>
  );
}
