"use client";
import { dailySeed, WORLDS } from "@cranea/core/cifra";
import { GameHome } from "@/components/game-home/game-home";
import { attemptsText, type GameHomeConfig } from "@/components/game-home/types";
import { dailyNumber, isLevelUnlocked, isWorldUnlocked, levelKey } from "../data";
import { hasSession } from "../session";
import { MAX_ATTEMPTS } from "../store";

const CONFIG: GameHomeConfig = {
  id: "cifra",
  name: "Cifra",
  pitch: "Cruzá intentos ya puntuados hasta que solo un código encaje.",
  article: "el",
  daily: {
    title: "Cifra del día",
    blurb: "El mismo tablero para todos. Tres intentos.",
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
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: `${r.attempts}/${MAX_ATTEMPTS}` }),
};

export const CifraHome = () => <GameHome config={CONFIG} />;
