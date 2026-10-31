"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { api } from "../../convex/_generated/api";
import type { Kind, Result } from "../../convex/results";
import { useProgress, type GameProgress } from "@/stores/progress";

type Entry = { gameId: string; kind: Kind; key: string; result: Result };

/** Resultados que el servidor ya conoce; se comparan por referencia. */
const synced = new WeakSet<Result>();

const same = (a: Result, b: Result) => a.won === b.won && a.attempts === b.attempts && a.timeMs === b.timeMs && a.at === b.at;

function entries(games: Record<string, GameProgress>): Entry[] {
  return Object.entries(games).flatMap(([gameId, g]) => [
    ...Object.entries(g.levels).map(([key, result]) => ({ gameId, kind: "level" as const, key, result })),
    ...Object.entries(g.daily).map(([key, result]) => ({ gameId, kind: "daily" as const, key, result })),
  ]);
}

/** true cuando el dispositivo ya tiene todo lo de la cuenta (o no hay sesión). */
export const useAccountReady = create<{ ready: boolean }>(() => ({ ready: false }));

/**
 * Con sesión iniciada, combina el progreso del dispositivo con el de la cuenta
 * y sube cada partida nueva. Sin conexión, lo pendiente se reintenta después.
 */
export function ProgressSync() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const remote = useQuery(api.progress.mine, isAuthenticated ? {} : "skip");
  const save = useMutation(api.progress.save);
  const sending = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) useAccountReady.setState({ ready: true });
    else if (isAuthenticated && remote === undefined) useAccountReady.setState({ ready: false });
  }, [isLoading, isAuthenticated, remote === undefined]);

  // Lo que llega de la cuenta se combina en el dispositivo.
  useEffect(() => {
    if (!remote) return;
    for (const { result } of remote) synced.add(result);
    useProgress.getState().mergeEntries(remote);
    // Partidas locales idénticas a las de la cuenta no hace falta volver a subirlas.
    const games = useProgress.getState().games;
    for (const { gameId, kind, key, result } of remote) {
      const local = games[gameId]?.[kind === "level" ? "levels" : "daily"][key];
      if (local && same(local, result)) synced.add(local);
    }
    useAccountReady.setState({ ready: true });
  }, [remote]);

  // Lo que todavía no está en la cuenta se sube.
  useEffect(() => {
    if (!isAuthenticated || remote === undefined) return;
    const push = async () => {
      if (sending.current) return;
      const pending = entries(useProgress.getState().games).filter((e) => !synced.has(e.result));
      if (!pending.length) return;
      sending.current = true;
      try {
        for (let i = 0; i < pending.length; i += 200) await save({ entries: pending.slice(i, i + 200) });
        for (const e of pending) synced.add(e.result);
      } catch {
        // Queda pendiente: se reintenta con la próxima partida o al volver la conexión.
      } finally {
        sending.current = false;
      }
    };
    void push();
    const unsubscribe = useProgress.subscribe(() => void push());
    window.addEventListener("online", push);
    return () => { unsubscribe(); window.removeEventListener("online", push); };
  }, [isAuthenticated, remote === undefined, save]);

  return null;
}
