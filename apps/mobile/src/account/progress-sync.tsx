import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { create } from "zustand";
import { api } from "@/lib/convex";
import { useProgress, type GameProgress, type Kind, type Result } from "@/stores/progress";

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
 * Igual que la web (components/progress-sync.tsx): con sesión, combina el progreso del dispositivo
 * con el de la cuenta y sube cada partida nueva. Sin conexión, lo pendiente se reintenta
 * con la próxima partida o al volver la app al frente.
 */
export function ProgressSync() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const hydrated = useProgress((s) => s.hydrated);
  const remote = useQuery(api.progress.mine, isAuthenticated ? {} : "skip");
  const save = useMutation(api.progress.save);
  const sending = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) useAccountReady.setState({ ready: true });
    else if (isAuthenticated && remote === undefined) useAccountReady.setState({ ready: false });
  }, [isLoading, isAuthenticated, remote === undefined]);

  // Lo que llega de la cuenta se combina en el dispositivo, después de leer lo guardado para no pisarlo.
  useEffect(() => {
    if (!remote || !hydrated) return;
    for (const { result } of remote) synced.add(result);
    useProgress.getState().mergeEntries(remote);
    // Partidas locales idénticas a las de la cuenta no hace falta volver a subirlas.
    const games = useProgress.getState().games;
    for (const { gameId, kind, key, result } of remote) {
      const local = games[gameId]?.[kind === "level" ? "levels" : "daily"][key];
      if (local && same(local, result)) synced.add(local);
    }
    useAccountReady.setState({ ready: true });
  }, [remote, hydrated]);

  // Lo que todavía no está en la cuenta se sube.
  useEffect(() => {
    if (!isAuthenticated || remote === undefined || !hydrated) return;
    const push = async () => {
      if (sending.current) return;
      const pending = entries(useProgress.getState().games).filter((e) => !synced.has(e.result));
      if (!pending.length) return;
      sending.current = true;
      try {
        for (let i = 0; i < pending.length; i += 200) await save({ entries: pending.slice(i, i + 200) });
        for (const e of pending) synced.add(e.result);
      } catch {
        // Queda pendiente: se reintenta con la próxima partida o al volver al frente.
      } finally {
        sending.current = false;
      }
    };
    void push();
    const unsubscribe = useProgress.subscribe(() => void push());
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void push();
    });
    return () => {
      unsubscribe();
      app.remove();
    };
  }, [isAuthenticated, remote === undefined, hydrated, save]);

  return null;
}
