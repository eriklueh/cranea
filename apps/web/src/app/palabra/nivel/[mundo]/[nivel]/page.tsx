import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PALABRA_WORLDS } from "@cranea/core/palabra";
import { TutorialGate } from "@/components/tutorial/gate";
import { PalabraTutorial } from "@/games/palabra/tutorial";
import { PalabraGame } from "@/games/palabra/components/palabra-game";
import { getWorld } from "@/games/palabra/data";
import { allLevelParams, getLevel } from "@/games/palabra/levels";

type Params = Promise<{ mundo: string; nivel: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => allLevelParams();

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mundo, nivel } = await params;
  return { title: `Palabra ${mundo}-${nivel}` };
}

export default async function LevelPage({ params }: { params: Params }) {
  const { mundo, nivel } = await params;
  const w = Number(mundo);
  const n = Number(nivel);
  const world = getWorld(w);
  const puzzle = getLevel(w, n);
  if (!world || !puzzle) notFound();

  const nextHref = n < world.levels ? `/palabra/nivel/${w}/${n + 1}` : getWorld(w + 1) ? `/palabra/nivel/${w + 1}/1` : null;

  return (
    <>
      <SiteHeader game={{ name: "Palabra", href: "/palabra" }} />
      {w === PALABRA_WORLDS[0].id && n === 1 ? (
        // La primera vez, el nivel 1 empieza con el tutorial.
        <TutorialGate game="palabra" levelKey={`w${w}-l${n}`} tutorial={<PalabraTutorial />}>
          <PalabraGame puzzle={puzzle} mode={{ kind: "level", world: w, level: n, nextHref }} />
        </TutorialGate>
      ) : (
        <PalabraGame puzzle={puzzle} mode={{ kind: "level", world: w, level: n, nextHref }} />
      )}
    </>
  );
}
