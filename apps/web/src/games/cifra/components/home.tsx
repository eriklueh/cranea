"use client";
import { dailySeed, WORLDS } from "@cranea/core/cifra";
import { GameHome } from "@/components/game-home/game-home";
import type { GameHomeConfig } from "@/components/game-home/types";
import { translator } from "@/lib/i18n";
import { dailyNumber, isLevelUnlocked, isWorldUnlocked, levelKey } from "../data";
import { hasSession } from "../session";
import { MAX_ATTEMPTS } from "../store";

const CONFIG: GameHomeConfig = {
  id: "cifra",
  name: "Cifra",
  pitch: "Cruzá intentos ya puntuados hasta que solo un código encaje.",
  article: "el",
  daily: {
    title: (locale) => translator(locale)("cifra.dailyHomeTitle"),
    blurb: (locale) => translator(locale)("cifra.dailyBlurb"),
    href: "/cifra/diario",
    number: dailyNumber,
    inProgress: (date) => hasSession(dailySeed(date)),
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/cifra/nivel/${w}/${l}`,
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: (r, locale) => translator(locale)("cifra.inAttempts", { count: r.attempts }),
  resultStat: (r, locale) => ({ label: translator(locale)("cifra.attemptsStat"), value: `${r.attempts}/${MAX_ATTEMPTS}` }),
};

export const CifraHome = () => <GameHome config={CONFIG} />;
