import type { Metadata } from "next";
import { ArchiveView } from "@/components/daily-hub/archive-view";
import { SiteHeader } from "@/components/site-header";
import { LAUNCH_DATE } from "@/games/torres/data";

export const metadata: Metadata = { title: "Torres: diarios anteriores" };

export default function ArchivePage() {
  return (
    <>
      <SiteHeader game={{ name: "Torres", href: "/torres" }} />
      <ArchiveView gameId="torres" home="/torres" launch={LAUNCH_DATE} />
    </>
  );
}
