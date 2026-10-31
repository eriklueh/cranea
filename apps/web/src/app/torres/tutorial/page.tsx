import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TorresTutorial } from "@/games/torres/tutorial";

export const metadata: Metadata = { title: "Tutorial de Torres" };

export default function TutorialPage() {
  return (
    <>
      <SiteHeader game={{ name: "Torres", href: "/torres" }} />
      <TorresTutorial />
    </>
  );
}
