import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { NonogramaGame } from "@/games/nonograma/components/nonograma-game";
import { allLevelParams, getLevel, getWorld } from "@/games/nonograma/data";

type Params = Promise<{ mundo: string; nivel: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => allLevelParams();

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mundo, nivel } = await params;
  return { title: `Nonograma ${mundo}-${nivel}` };
}

export default async function LevelPage({ params }: { params: Params }) {
  const { mundo, nivel } = await params;
  const w = Number(mundo);
  const n = Number(nivel);
  const world = getWorld(w);
  const puzzle = getLevel(w, n);
  if (!world || !puzzle) notFound();

  const nextHref = n < world.levels ? `/nonograma/nivel/${w}/${n + 1}` : getWorld(w + 1) ? `/nonograma/nivel/${w + 1}/1` : null;

  return (
    <>
      <SiteHeader game={{ name: "Nonograma", href: "/nonograma" }} />
      <NonogramaGame puzzle={puzzle} mode={{ kind: "level", world: w, level: n, nextHref }} />
    </>
  );
}
