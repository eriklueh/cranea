"use client";
import { WORLDS } from "@cranea/core/nonograma";
import { GameHome } from "@/components/game-home/game-home";
import { attemptsText, type GameHomeConfig } from "@/components/game-home/types";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey, levelRows, levelTitle } from "../data";
import { MAX_ATTEMPTS } from "../store";
import { PixelArt } from "./pixel-art";

const CONFIG: GameHomeConfig = {
  id: GAME_ID,
  name: "Nonograma",
  pitch: "Pintá casillas siguiendo los números hasta que aparezca el dibujo.",
  article: "el",
  daily: {
    title: "Nonograma del día",
    blurb: "Un 10×10 nuevo, el mismo para todos.",
    href: "/nonograma/diario",
    number: dailyNumber,
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/nonograma/nivel/${w}/${l}`,
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: attemptsText,
  resultStat: (r) => ({ label: "Intentos", value: `${r.attempts}/${MAX_ATTEMPTS}` }),
  unit: { one: "dibujo", many: "dibujos" },
  thumbnail: (w, l) => {
    const rows = levelRows(w, l);
    return rows ? <PixelArt rows={rows} className="size-[60%] -translate-y-0.5" /> : null;
  },
  levelTitle,
};

export const NonogramaHome = () => <GameHome config={CONFIG} />;
