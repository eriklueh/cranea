"use client";
import { WORLDS } from "@cranea/core/puentes";
import { GameHome } from "@/components/game-home/game-home";
import type { GameHomeConfig } from "@/components/game-home/types";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey, starsFor } from "../data";
import { translator } from "@/lib/i18n";
import { mistakesText } from "./result-dialog";

const CONFIG: GameHomeConfig = {
  id: GAME_ID,
  name: "Puentes",
  pitch: "Uní todas las islas con puentes rectos, sin cruzarlos.",
  article: "el",
  daily: {
    title: (locale) => translator(locale)("puentes.dailyHomeTitle"),
    blurb: (locale) => translator(locale)("puentes.dailyBlurb"),
    href: "/puentes/diario",
    number: dailyNumber,
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/puentes/nivel/${w}/${l}`,
  stars: (r) => starsFor(r.attempts),
  resultText: (r, locale) => mistakesText(r.attempts - 1, translator(locale)),
  resultStat: (r, locale) => ({ label: translator(locale)("puentes.mistakesStat"), value: String(r.attempts - 1) }),
};

export const PuentesHome = () => <GameHome config={CONFIG} />;
