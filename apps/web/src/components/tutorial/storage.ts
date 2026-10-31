"use client";
import { useProgress } from "@/stores/progress";

/** Qué tutoriales ya se terminaron o se saltearon, por juego. Vive aparte de `cranea-progress`. */
const KEY = "cranea-tutorials";

export type TutorialMark = "done" | "skipped";

function readAll(): Record<string, { state: TutorialMark; at: number }> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, { state: TutorialMark; at: number }>) : {};
  } catch {
    return {};
  }
}

export function tutorialMark(game: string): TutorialMark | null {
  const entry = readAll()[game];
  return entry?.state === "done" || entry?.state === "skipped" ? entry.state : null;
}

export function markTutorial(game: string, state: TutorialMark) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [game]: { state, at: Date.now() } }));
  } catch {
    /* almacenamiento bloqueado: se vuelve a ofrecer, no pasa nada */
  }
}

/** El tutorial se muestra solo la primera vez: si nunca se vio y el primer nivel (`levelKey`) no tiene partidas. */
export function shouldOfferTutorial(game: string, levelKey: string) {
  if (tutorialMark(game)) return false;
  return !useProgress.getState().games[game]?.levels[levelKey];
}
