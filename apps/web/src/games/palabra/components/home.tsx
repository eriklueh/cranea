"use client";
import { PALABRA_WORLDS } from "@cranea/core/palabra";
import { GameHome } from "@/components/game-home/game-home";
import { attemptsText, type GameHomeConfig } from "@/components/game-home/types";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey } from "../data";

const CONFIG: GameHomeConfig = {
  id: GAME_ID,
  name: "Palabra",
  pitch: "Adiviná la palabra de cinco letras. Los colores te van guiando.",
  article: "la",
  daily: {
    title: "Palabra del día",
    blurb: "La misma para todos. Seis intentos.",
    href: "/palabra/diario",
    number: dailyNumber,
  },
  worlds: PALABRA_WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/palabra/nivel/${w}/${l}`,
  // Tres puntos con hasta 3 intentos, dos con 4, uno con más.
  stars: (r) => (r.attempts <= 3 ? 3 : r.attempts === 4 ? 2 : 1),
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: r.won ? String(r.attempts) : "X" }),
};

export const PalabraHome = () => <GameHome config={CONFIG} />;
