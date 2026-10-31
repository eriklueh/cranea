import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TorresHome } from "@/games/torres/components/home";

export const metadata: Metadata = { title: "Torres" };

export default function TorresPage() {
  return (
    <>
      <SiteHeader game={{ name: "Torres", href: "/torres", current: true }} />
      <TorresHome />
    </>
  );
}
