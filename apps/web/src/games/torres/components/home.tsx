"use client";
import { WORLDS } from "@cranea/core/torres";
import { GameHome } from "@/components/game-home/game-home";
import { attemptsText, type GameHomeConfig } from "@/components/game-home/types";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey } from "../data";
import { MAX_ATTEMPTS } from "../store";

const CONFIG: GameHomeConfig = {
  id: GAME_ID,
  name: "Torres",
  pitch: "Levantá la ciudad: cada borde dice cuántas torres se ven.",
  article: "el",
  daily: {
    title: "Torres del día",
    blurb: "Una ciudad de 5×5, la misma para todos.",
    href: "/torres/diario",
    number: dailyNumber,
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/torres/nivel/${w}/${l}`,
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: `${r.attempts}/${MAX_ATTEMPTS}` }),
};

export const TorresHome = () => <GameHome config={CONFIG} />;
