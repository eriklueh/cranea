"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { shouldOfferTutorial } from "./storage";

/** Dentro del nivel 1: al terminar o saltear el tutorial, se juega el nivel ahí mismo. */
const GateContext = createContext<{ leave: () => void } | null>(null);
export const useTutorialGate = () => useContext(GateContext);

/**
 * Envuelve el primer nivel del primer mundo (`levelKey`, como lo guarda el progreso). La primera vez muestra el tutorial en su lugar.
 * Hasta saber si corresponde no monta el nivel, para no arrancar (ni guardar) una partida de más.
 */
export function TutorialGate({ game, levelKey, tutorial, children }: { game: string; levelKey: string; tutorial: ReactNode; children: ReactNode }) {
  const hydrated = useHydrated();
  const [show, setShow] = useState<boolean | null>(null);
  useEffect(() => {
    if (hydrated) setShow(shouldOfferTutorial(game, levelKey));
  }, [hydrated, game, levelKey]);
  if (show === null) return <div className="min-h-[70svh]" aria-busy />;
  if (!show) return children;
  return <GateContext.Provider value={{ leave: () => setShow(false) }}>{tutorial}</GateContext.Provider>;
}
