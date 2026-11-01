"use client";
import { SparklesIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { todayKey } from "@cranea/core";
import { openPaywall } from "@/components/plus/paywall";
import { GAMES } from "@/games/registry";
import { PLUS_TRIAL, usePlus } from "@/lib/plus";

/**
 * Cuándo se mostró la tarjeta de cada juego. A lo sumo una vez por día y por juego: el mismo momento
 * (el diario de hoy, en su diálogo y en la pantalla de "ya jugado") la puede volver a mostrar, otro no.
 * Cerrarla la saca por el resto del día. Igual que la app (components/plus-nudge.tsx).
 */
const KEY = "cranea-plus-nudge";
interface Seen {
  date: string;
  /** Dónde apareció: "daily:2026-11-01", "level:1-2". */
  slot: string;
  dismissed: boolean;
}
function readSeen(): Record<string, Seen> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
const writeSeen = (gameId: string, seen: Seen) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readSeen(), [gameId]: seen }));
  } catch {
    /* sin almacenamiento: se muestra igual, sin recordar */
  }
};

export type NudgeMode = { kind: "level"; world: number; level: number } | { kind: "daily"; date: string; practice?: boolean };

/**
 * "¿Querés seguir?": al terminar el diario o un nivel gratis, una tarjeta chica que ofrece Plus. Nunca con
 * Plus (ni con Plus apagado, que es como tenerlo), nunca en una práctica, y va debajo de las acciones.
 * `levels`: niveles de Plus del juego (`plusLevelCount`). `onLeave` cierra el diálogo antes de abrir Plus.
 */
export function PlusNudge({ gameId, levels, mode, won = true, onLeave }: { gameId: string; levels: number; mode: NudgeMode | { kind: string }; won?: boolean; onLeave?: () => void }) {
  const { plus, ready } = usePlus();
  const slot = mode.kind === "level" && "world" in mode ? `level:${mode.world}-${mode.level}` : mode.kind === "daily" && "date" in mode && !mode.practice ? `daily:${mode.date}` : null;
  // Se decide en el cliente, una vez: depende de localStorage.
  const [shown, setShown] = useState(false);
  const active = Boolean(slot) && won && ready && !plus && levels > 0;

  useEffect(() => {
    if (!active || !slot) return;
    const today = todayKey();
    const r = readSeen()[gameId];
    if (r?.date === today && (r.slot !== slot || r.dismissed)) return;
    if (r?.date !== today || r.slot !== slot) writeSeen(gameId, { date: today, slot, dismissed: false });
    setShown(true);
  }, [active, gameId, slot]);

  if (!active || !shown || !slot) return null;
  const game = GAMES.find((g) => g.id === gameId)?.name ?? "este juego";
  const dismiss = () => {
    writeSeen(gameId, { date: todayKey(), slot, dismissed: true });
    setShown(false);
  };

  return (
    <aside aria-label="Craneá Plus" className="relative flex items-start gap-3 rounded-xl border border-border bg-clue-present-bg/70 p-3 pr-11 motion-safe:animate-in motion-safe:fade-in-0">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-clue-present">
        <SparklesIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">¿Querés seguir?</p>
        <p className="text-sm text-muted-foreground">Tenés {levels} niveles más de {game} con Craneá Plus.</p>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            onLeave?.();
            openPaywall("levels");
          }}
          className="mt-1 -ml-1 inline-flex min-h-11 items-center rounded-md px-1 text-sm font-semibold text-clue-present underline decoration-2 underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {PLUS_TRIAL || "Ver Craneá Plus"}
        </button>
      </div>
      <button
        type="button"
        aria-label="Ahora no"
        onClick={dismiss}
        className="absolute top-1 right-1 grid size-11 place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <XIcon className="size-4" />
      </button>
    </aside>
  );
}
