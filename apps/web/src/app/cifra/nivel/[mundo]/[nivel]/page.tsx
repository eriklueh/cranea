import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CifraGame } from "@/games/cifra/components/cifra-game";
import { allLevelParams, getLevel, getWorld } from "@/games/cifra/data";

type Params = Promise<{ mundo: string; nivel: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => allLevelParams();

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mundo, nivel } = await params;
  return { title: `Cifra ${mundo}-${nivel}` };
}

export default async function LevelPage({ params }: { params: Params }) {
  const { mundo, nivel } = await params;
  const w = Number(mundo);
  const n = Number(nivel);
  const world = getWorld(w);
  const puzzle = getLevel(w, n);
  if (!world || !puzzle) notFound();

  const nextHref = n < world.levels ? `/cifra/nivel/${w}/${n + 1}` : getWorld(w + 1) ? `/cifra/nivel/${w + 1}/1` : null;

  return (
    <>
      <SiteHeader />
      <CifraGame puzzle={puzzle} mode={{ kind: "level", world: w, level: n, nextHref }} />
    </>
  );
}
