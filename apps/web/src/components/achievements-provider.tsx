"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { XIcon } from "lucide-react";
import type { AchievementState } from "@cranea/core/achievements";
import { api } from "../../convex/_generated/api";
import { accountsEnabled } from "@/components/account-provider";
import { AchievementIcon } from "@/components/achievement-icon";
import { useAccountReady } from "@/components/progress-sync";
import { useAchievements, useAchievementsReady } from "@/stores/achievements";
import { useProgress } from "@/stores/progress";

/** Si la cuenta no responde (sin conexión), se evalúa igual después de esto. */
const READY_TIMEOUT_MS = 5000;
/** Espera antes de mostrar el aviso, para no tapar el festejo del juego. */
const TOAST_DELAY_MS = 1200;
const TOAST_MS = 6000;

type Toast = { key: number; one: AchievementState } | { key: number; many: number };

/**
 * Logros en toda la app: los evalúa con cada cambio del progreso, festeja los nuevos y, con sesión,
 * los sincroniza con la cuenta. Va una vez en el layout.
 */
export function Achievements() {
  return (
    <>
      {accountsEnabled ? <AchievementsSync /> : null}
      <AchievementsWatcher />
    </>
  );
}

function AchievementsWatcher() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const progressReady = useAccountReady((s) => s.ready);
  const remoteReady = useAchievementsReady((s) => s.ready);
  const [timedOut, setTimedOut] = useState(false);
  const ready = !accountsEnabled || (progressReady && remoteReady) || timedOut;

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let unsubscribe = () => {};
    let key = 0;
    // El catálogo y los mundos van en un chunk aparte: no pesan en la primera carga de cada página.
    void import("@/lib/achievements").then(({ evaluate }) => {
      if (cancelled) return;
      const check = () => {
        const store = useAchievements.getState();
        const fresh = evaluate(useProgress.getState().games).filter((a) => a.unlocked && store.unlocked[a.id] === undefined);
        if (fresh.length) store.unlock(fresh.map((a) => ({ id: a.id, at: a.at ?? Date.now() })));
        if (!store.seeded) {
          store.setSeeded();
          return;
        }
        if (!fresh.length) return;
        const next: Toast[] = fresh.length > 2 ? [{ key: ++key, many: fresh.length }] : fresh.map((one) => ({ key: ++key, one }));
        setToasts((q) => [...q, ...next]);
      };
      check();
      unsubscribe = useProgress.subscribe((s, prev) => {
        if (s.games !== prev.games) check();
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [ready]);

  const current = toasts[0];
  return current ? <AchievementToast key={current.key} toast={current} onDone={() => setToasts((q) => q.slice(1))} /> : null;
}

function AchievementToast({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), TOAST_DELAY_MS);
    const hide = setTimeout(() => done.current(), TOAST_DELAY_MS + TOAST_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex justify-center px-3"
    >
      {visible && (
        <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border-2 border-ink bg-card p-2 pl-3 text-card-foreground shadow-[0_4px_0_0_var(--shadow-ink)] animate-dialog-in motion-reduce:animate-none">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-clue-present-bg text-clue-present">
            <AchievementIcon icon={"one" in toast ? toast.one.icon : "trophy"} className="size-6" />
          </span>
          <Link href="/logros" className="min-w-0 flex-1 rounded-md py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span className="block text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {"one" in toast ? "Logro desbloqueado" : "Logros desbloqueados"}
            </span>
            <span className="block truncate font-display text-lg leading-tight font-extrabold">
              {"one" in toast ? toast.one.name : `¡${toast.many} logros nuevos!`}
            </span>
          </Link>
          <button
            type="button"
            onClick={onDone}
            aria-label="Cerrar aviso"
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <XIcon className="size-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/** Con sesión: trae los logros de la cuenta y sube los que todavía no están. */
function AchievementsSync() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const remote = useQuery(api.achievements.mine, isAuthenticated ? {} : "skip");
  const save = useMutation(api.achievements.save);
  const known = useRef(new Map<string, number>());
  const sending = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) useAchievementsReady.setState({ ready: true });
    else if (isAuthenticated && remote === undefined) useAchievementsReady.setState({ ready: false });
  }, [isLoading, isAuthenticated, remote === undefined]);

  useEffect(() => {
    if (!remote) return;
    known.current = new Map(remote.map((r) => [r.id, r.at]));
    useAchievements.getState().unlock(remote);
    useAchievementsReady.setState({ ready: true });
  }, [remote]);

  useEffect(() => {
    if (!isAuthenticated || remote === undefined) return;
    const push = async () => {
      if (sending.current) return;
      const pending = Object.entries(useAchievements.getState().unlocked)
        .filter(([id, at]) => {
          const saved = known.current.get(id);
          return saved === undefined || saved > at;
        })
        .map(([id, at]) => ({ id, at }));
      if (!pending.length) return;
      sending.current = true;
      try {
        for (let i = 0; i < pending.length; i += 100) await save({ items: pending.slice(i, i + 100) });
        for (const { id, at } of pending) known.current.set(id, at);
      } catch {
        // Sin conexión: se reintenta con el próximo logro o al volver la conexión.
      } finally {
        sending.current = false;
      }
    };
    void push();
    const unsubscribe = useAchievements.subscribe((s, prev) => {
      if (s.unlocked !== prev.unlocked) void push();
    });
    window.addEventListener("online", push);
    return () => {
      unsubscribe();
      window.removeEventListener("online", push);
    };
  }, [isAuthenticated, remote === undefined, save]);

  return null;
}
