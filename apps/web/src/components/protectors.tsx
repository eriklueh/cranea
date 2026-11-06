"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ShieldIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { todayKey } from "@cranea/core";
import { DAYS_PER_PROTECTOR, grantPlus, MAX_PROTECTORS, sameProtectors, unseenCovered } from "@cranea/core/protectors";
import { api } from "../../convex/_generated/api";
import { accountsEnabled } from "@/components/account-provider";
import { craneaStreak } from "@/components/daily-hub/dailies";
import { useClock } from "@/components/game-home/use-clock";
import { useAccountReady } from "@/components/progress-sync";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GAMES } from "@/games/registry";
import { getLocale, getT, useT } from "@/lib/i18n";
import { gamesFor } from "@cranea/core/i18n";
import { cn } from "@/lib/utils";
import { usePlusStore } from "@/lib/plus";
import { dailyStreak, protectorsOf, useProgress, type ProtectorState } from "@/stores/progress";

/** Si la cuenta no responde (sin conexión), se sigue igual después de esto. */
const READY_TIMEOUT_MS = 5000;
const TOAST_DELAY_MS = 1200;
const TOAST_MS = 6000;

const useProtectorsReady = create<{ ready: boolean }>(() => ({ ready: false }));

/** La racha más larga que hoy sigue viva (de un juego visible o la Racha Craneá). */
function liveStreak(today: string) {
  const { games } = useProgress.getState();
  const locale = getLocale();
  const per = gamesFor(GAMES, locale).filter((g) => g.status === "live").map((g) => dailyStreak(games[g.id]?.daily ?? {}, today));
  return Math.max(0, craneaStreak(games, today, locale), ...per);
}

/** Stock de protectores para hoy (null hasta montar en el cliente). */
export function useProtectors() {
  const now = useClock(60_000);
  const games = useProgress((s) => s.games);
  const protectors = useProgress((s) => s.protectors);
  if (now === null) return null;
  return protectorsOf({ games, protectors }, todayKey(new Date(now))).status;
}

/**
 * Protector de racha en toda la web: crea el estado la primera vez, anota el regalo mensual de Plus,
 * avisa cuando se usó uno y, con sesión, lo sincroniza con la cuenta. Va una vez en el layout.
 */
export function Protectors() {
  return (
    <>
      {accountsEnabled ? <ProtectorsSync /> : null}
      <ProtectorsWatcher />
    </>
  );
}

function ProtectorsWatcher() {
  const progressReady = useAccountReady((s) => s.ready);
  const remoteReady = useProtectorsReady((s) => s.ready);
  const [timedOut, setTimedOut] = useState(false);
  const ready = !accountsEnabled || (progressReady && remoteReady) || timedOut;
  // Plus "de verdad" (no el interruptor PLUS_ENABLED, que hoy deja todo libre en la web).
  const plus = usePlusStore((s) => s.ready && s.plus);
  const now = useClock(60_000);
  const [toast, setToast] = useState<{ key: number; used: number; streak: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  const today = now === null ? null : todayKey(new Date(now));

  useEffect(() => {
    if (!ready || !today) return;
    const p = useProgress.getState();
    if (!p.protectors) p.mergeProtectors(undefined, today);
    const s = useProgress.getState().protectors;
    if (plus && s) p.mergeProtectors(grantPlus(s, today));
  }, [ready, plus, today]);

  useEffect(() => {
    if (!ready || !today) return;
    const check = () => {
      const st = useProgress.getState();
      if (!st.protectors) return;
      const fresh = unseenCovered(protectorsOf(st, today).status, st.protectors);
      if (!fresh.length) return;
      st.mergeProtectors({ ...st.protectors, seen: [...st.protectors.seen, ...fresh] });
      setToast({ key: Date.now(), used: fresh.length, streak: liveStreak(today) });
    };
    check();
    return useProgress.subscribe((s, prev) => {
      if (s.games !== prev.games || s.protectors !== prev.protectors) check();
    });
  }, [ready, today]);

  return toast ? <ProtectorToast key={toast.key} used={toast.used} streak={toast.streak} onDone={() => setToast(null)} /> : null;
}

/** "Usaste un protector: tu racha sigue en 12". */
export const usedText = (used: number, streak: number, t = getT()) => t("shell.protectorUsed", { used, streak });

function ProtectorToast({ used, streak, onDone }: { used: number; streak: number; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  const t = useT();
  useEffect(() => {
    const show = setTimeout(() => setVisible(true), TOAST_DELAY_MS);
    const hide = setTimeout(() => done.current(), TOAST_DELAY_MS + TOAST_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex justify-center px-3">
      {visible && (
        <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border-2 border-ink bg-card p-2 pl-3 text-card-foreground shadow-[0_4px_0_0_var(--shadow-ink)] anim-dialog-in motion-reduce:animate-none">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldIcon aria-hidden className="size-6" />
          </span>
          <p className="min-w-0 flex-1 py-1 font-display text-base leading-tight font-extrabold">{usedText(used, streak, t)}</p>
          <button
            type="button"
            onClick={onDone}
            aria-label={t("shell.closeNotice")}
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <XIcon className="size-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/** Con sesión: trae los protectores de la cuenta, los combina y sube los cambios. */
function ProtectorsSync() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const remote = useQuery(api.protectors.mine, isAuthenticated ? {} : "skip");
  const save = useMutation(api.protectors.save);
  const known = useRef<ProtectorState | undefined>(undefined);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) useProtectorsReady.setState({ ready: true });
    else if (isAuthenticated && remote === undefined) useProtectorsReady.setState({ ready: false });
  }, [isLoading, isAuthenticated, remote === undefined]);

  useEffect(() => {
    if (remote === undefined) return;
    known.current = remote ?? undefined;
    if (remote) useProgress.getState().mergeProtectors(remote);
    useProtectorsReady.setState({ ready: true });
  }, [remote]);

  useEffect(() => {
    if (!isAuthenticated || remote === undefined) return;
    const push = () => {
      const local = useProgress.getState().protectors;
      if (!local || sameProtectors(local, known.current)) return;
      save({ state: local }).then(() => (known.current = local), () => {});
    };
    push();
    const unsubscribe = useProgress.subscribe((s, prev) => {
      if (s.protectors !== prev.protectors) push();
    });
    window.addEventListener("online", push);
    return () => {
      unsubscribe();
      window.removeEventListener("online", push);
    };
  }, [isAuthenticated, remote === undefined, save]);

  return null;
}

/** 🛡️×N al lado de la racha; al tocarlo explica cómo funcionan. */
export function ProtectorBadge({ className, compact }: { className?: string; compact?: boolean }) {
  const status = useProtectors();
  const t = useT();
  if (!status) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("shell.protectorBadge", { count: status.stock })}
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-full font-semibold text-primary tabular-nums outline-none hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/50",
            compact ? "-my-1 min-h-7 px-1" : "bg-primary/10 px-2 py-0.5 text-sm",
            status.stock === 0 && "text-muted-foreground",
            className,
          )}
        >
          <ShieldIcon aria-hidden className="size-3.5" />×{status.stock}
        </button>
      </DialogTrigger>
      <DialogContent>
        <ProtectorsExplainer stock={status.stock} nextIn={status.nextIn} />
      </DialogContent>
    </Dialog>
  );
}

function ProtectorsExplainer({ stock, nextIn }: { stock: number; nextIn: number }) {
  const t = useT();
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShieldIcon aria-hidden className="size-6 text-primary" /> {t("shell.protectorTitle")}
        </DialogTitle>
        <DialogDescription>
          {stock === 0 ? t("shell.protectorNone") : t("shell.protectorHave", { count: stock })}{" "}
          {stock < MAX_PROTECTORS && t("shell.protectorNext", { count: nextIn })}
        </DialogDescription>
      </DialogHeader>
      <ul className="list-disc space-y-1.5 pl-5 text-sm">
        <li>{t("shell.protectorRule1")}</li>
        <li>{t("shell.protectorRule2", { days: DAYS_PER_PROTECTOR, max: MAX_PROTECTORS })}</li>
        <li>{t("shell.protectorRule3", { max: MAX_PROTECTORS })}</li>
        <li>{t("shell.protectorRule4")}</li>
      </ul>
    </>
  );
}

/** Tarjeta para /estadisticas. */
export function ProtectorsCard() {
  const status = useProtectors();
  const t = useT();
  if (!status) return <div className="h-[4.75rem]" />;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-xl border-2 border-ink bg-card p-4 text-left shadow-[0_4px_0_0_var(--shadow-ink)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldIcon aria-hidden className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl font-extrabold">{t("shell.protectorsCard")}</span>
            <span className="block text-sm text-muted-foreground tabular-nums">
              {t("shell.protectorsStock", { stock: status.stock, max: MAX_PROTECTORS })}
              {status.stock < MAX_PROTECTORS && t("shell.protectorsNextIn", { count: status.nextIn })}
            </span>
          </span>
          <span className="font-display text-2xl font-extrabold text-primary tabular-nums" aria-hidden>
            ×{status.stock}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <ProtectorsExplainer stock={status.stock} nextIn={status.nextIn} />
      </DialogContent>
    </Dialog>
  );
}
