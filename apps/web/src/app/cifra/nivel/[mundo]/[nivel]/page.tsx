import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { WORLDS } from "@cranea/core/cifra";
import { PlusGate } from "@/components/plus/paywall";
import { TutorialGate } from "@/components/tutorial/gate";
import { CifraTutorial } from "@/games/cifra/tutorial";
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
      <SiteHeader game={{ name: "Cifra", href: "/cifra" }} />
      {w === WORLDS[0].id && n === 1 ? (
        // La primera vez, el nivel 1 empieza con el tutorial.
        <TutorialGate game="cifra" levelKey={`w${w}-l${n}`} tutorial={<CifraTutorial />}>
          <PlusGate reason="levels" daily="/cifra/diario">
            <CifraGame puzzle={puzzle} mode={{ kind: "level", world: w, level: n, nextHref }} />
          </PlusGate>
        </TutorialGate>
      ) : (
        <PlusGate reason="levels" daily="/cifra/diario">
          <CifraGame puzzle={puzzle} mode={{ kind: "level", world: w, level: n, nextHref }} />
        </PlusGate>
      )}
    </>
  );
}
