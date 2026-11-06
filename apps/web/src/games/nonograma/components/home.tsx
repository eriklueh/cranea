"use client";
import { WORLDS } from "@cranea/core/nonograma";
import { GameHome } from "@/components/game-home/game-home";
import type { GameHomeConfig } from "@/components/game-home/types";
import { pictureTitle } from "@cranea/core/i18n";
import { translator } from "@/lib/i18n";
import { dailyNumber, GAME_ID, isLevelUnlocked, isWorldUnlocked, levelKey, levelRows, levelTitle } from "../data";
import { MAX_ATTEMPTS } from "../store";
import { PixelArt } from "./pixel-art";

const CONFIG: GameHomeConfig = {
  id: GAME_ID,
  name: "Nonograma",
  pitch: "Pintá casillas siguiendo los números hasta que aparezca el dibujo.",
  article: "el",
  daily: {
    title: (locale) => translator(locale)("nonograma.dailyName"),
    blurb: (locale) => translator(locale)("nonograma.dailyBlurb"),
    href: "/nonograma/diario",
    number: dailyNumber,
  },
  worlds: WORLDS,
  isWorldUnlocked,
  isLevelUnlocked,
  levelKey,
  levelHref: (w, l) => `/nonograma/nivel/${w}/${l}`,
  stars: (r) => Math.max(1, MAX_ATTEMPTS + 1 - r.attempts),
  resultText: (r, locale) => translator(locale)("nonograma.inAttempts", { count: r.attempts }),
  resultStat: (r, locale) => ({ label: translator(locale)("nonograma.statAttempts"), value: `${r.attempts}/${MAX_ATTEMPTS}` }),
  unit: { one: (locale) => translator(locale)("nonograma.unitOne"), many: (locale) => translator(locale)("nonograma.unitMany") },
  thumbnail: (w, l) => {
    const rows = levelRows(w, l);
    return rows ? <PixelArt rows={rows} className="size-[60%] -translate-y-0.5" /> : null;
  },
  levelTitle: (w, l, locale) => pictureTitle(levelTitle(w, l), locale),
};

export const NonogramaHome = () => <GameHome config={CONFIG} />;
