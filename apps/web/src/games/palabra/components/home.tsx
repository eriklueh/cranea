"use client";
import { PALABRA_WORLDS } from "@cranea/core/palabra";
import { GameHome } from "@/components/game-home/game-home";
import { attemptsText, type GameHomeConfig } from "@/components/game-home/types";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey } from "../data";
import { MAX_ATTEMPTS } from "../store";

const CONFIG: GameHomeConfig = {
  id: GAME_ID,
  name: "Palabra",
  pitch: "Cruzá palabras ya puntuadas hasta que solo una encaje.",
  article: "la",
  daily: {
    title: "Palabra del día",
    blurb: "La misma para todos. Tres intentos.",
    href: "/palabra/diario",
    number: dailyNumber,
  },
  worlds: PALABRA_WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/palabra/nivel/${w}/${l}`,
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: `${r.attempts}/${MAX_ATTEMPTS}` }),
};

export const PalabraHome = () => <GameHome config={CONFIG} />;
