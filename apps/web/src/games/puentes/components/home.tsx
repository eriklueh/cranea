"use client";
import { WORLDS } from "@cranea/core/puentes";
import { GameHome } from "@/components/game-home/game-home";
import type { GameHomeConfig } from "@/components/game-home/types";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey, starsFor } from "../data";
import { mistakesText } from "./result-dialog";

const CONFIG: GameHomeConfig = {
  id: GAME_ID,
  name: "Puentes",
  pitch: "Uní todas las islas con puentes rectos, sin cruzarlos.",
  article: "el",
  daily: {
    title: "Puentes del día",
    blurb: "Un mapa nuevo, el mismo para todos.",
    href: "/puentes/diario",
    number: dailyNumber,
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/puentes/nivel/${w}/${l}`,
  stars: (r) => starsFor(r.attempts),
  resultText: (r) => mistakesText(r.attempts - 1),
  resultStat: (r) => ({ label: "Errores", value: String(r.attempts - 1) }),
};

export const PuentesHome = () => <GameHome config={CONFIG} />;
