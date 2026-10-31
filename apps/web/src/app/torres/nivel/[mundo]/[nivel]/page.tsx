import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TorresGame } from "@/games/torres/components/torres-game";
import { allLevelParams, getLevel, getWorld } from "@/games/torres/data";

type Params = Promise<{ mundo: string; nivel: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => allLevelParams();

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mundo, nivel } = await params;
  return { title: `Torres ${mundo}-${nivel}` };
}

export default async function LevelPage({ params }: { params: Params }) {
  const { mundo, nivel } = await params;
  const w = Number(mundo);
  const n = Number(nivel);
  const world = getWorld(w);
  const puzzle = getLevel(w, n);
  if (!world || !puzzle) notFound();

  const nextHref = n < world.levels ? `/torres/nivel/${w}/${n + 1}` : getWorld(w + 1) ? `/torres/nivel/${w + 1}/1` : null;

  return (
    <>
      <SiteHeader />
      <TorresGame puzzle={puzzle} mode={{ kind: "level", world: w, level: n, nextHref }} />
    </>
  );
}
