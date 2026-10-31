"use client";

import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, FlameIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { todayKey } from "@cranea/core";
import { accountsEnabled } from "@/components/account-provider";
import { useAccountReady } from "@/components/progress-sync";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn, formatTime } from "@/lib/utils";
import { dailyStreak, useProgress, type Result } from "@/stores/progress";

/** Sin conexión la cuenta puede no responder: no se bloquea el diario para siempre. */
const ACCOUNT_WAIT_MS = 4000;

interface Props {
  gameId: string;
  /** Nombre del juego, para "Volver a …". */
  game: string;
  home: string;
  title: (date: string) => string;
  /** La solución de hoy, para mostrar cuando ya se jugó. */
  reveal?: (date: string) => ReactNode;
  /** `practice`: repetición de un diario ya jugado, que no se guarda ni cuenta para el ranking. */
  children: (date: string, practice: boolean) => ReactNode;
}

/**
 * El diario cuenta una sola vez por día. Antes de mostrar el tablero espera el progreso
 * de la cuenta, así una repetición desde otro dispositivo no pasa por primera partida.
 * Ya jugado, se puede repetir como práctica: no se guarda ni entra al ranking.
 * El resultado se lee al entrar: terminar la partida no cambia la pantalla.
 */
export function DailyGate({ gameId, game, home, title, reveal, children }: Props) {
  const hydrated = useHydrated();
  const accountReady = useAccountReady((s) => s.ready);
  const [waited, setWaited] = useState(false);
  const [entry, setEntry] = useState<{ date: string; played: Result | null } | null>(null);
  const [practice, setPractice] = useState(false);
  const ready = hydrated && (!accountsEnabled || accountReady || waited);

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), ACCOUNT_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || entry) return;
    const date = todayKey();
    setEntry({ date, played: useProgress.getState().games[gameId]?.daily[date] ?? null });
  }, [ready, entry, gameId]);

  if (!entry) {
    return (
      <main className="mx-auto w-full max-w-md px-4 pt-4 text-muted-foreground" aria-busy>
        {hydrated && !ready ? "Buscando tus partidas…" : "Preparando el tablero…"}
      </main>
    );
  }
  if (!entry.played) {
    return (
      <>
        {accountsEnabled && <OfficialStart gameId={gameId} date={entry.date} />}
        {children(entry.date, false)}
      </>
    );
  }
  if (practice) {
    return (
      <>
        <p className="mx-auto mb-2 flex w-full max-w-md items-center gap-2 px-4 text-sm text-muted-foreground" role="status">
          <RotateCcwIcon className="size-4 shrink-0" aria-hidden /> Práctica: no se guarda ni cuenta para el ranking.
        </p>
        {children(entry.date, true)}
      </>
    );
  }
  return <DailyDone gameId={gameId} game={game} home={home} date={entry.date} title={title(entry.date)} result={entry.played} reveal={reveal?.(entry.date)} onPractice={() => setPractice(true)} />;
}

/**
 * Con sesión, el servidor anota cuándo se abrió el tablero: ese es el intento oficial
 * para el ranking y su tiempo lo mide el servidor. Sin sesión, se avisa que no entra.
 */
function OfficialStart({ gameId, date }: { gameId: string; date: string }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const start = useMutation(api.ranking.startDaily);
  const sent = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || sent.current) return;
    sent.current = true;
    start({ gameId, date }).catch(() => { sent.current = false; });
  }, [isAuthenticated, start, gameId, date]);
  if (isLoading || isAuthenticated) return null;
  return (
    <p className="mx-auto mb-2 w-full max-w-md px-4 text-xs text-muted-foreground">
      Jugás sin sesión: este diario no va a entrar al ranking.
    </p>
  );
}

function untilTomorrow(now: number) {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  const min = Math.max(1, Math.ceil((next.getTime() - now) / 60_000));
  const h = Math.floor(min / 60);
  return h ? `${h} h ${min % 60} min` : `${min} min`;
}

function DailyDone({ gameId, game, home, date, title, result, reveal, onPractice }: {
  gameId: string; game: string; home: string; date: string; title: string; result: Result; reveal?: ReactNode; onPractice: () => void;
}) {
  const streak = useProgress((s) => dailyStreak(s.games[gameId]?.daily ?? {}, date));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const tomorrow = todayKey(new Date(now)) !== date;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-2 pb-10">
      <div>
        <Link href={home} className="-ml-1 inline-flex min-h-11 items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeftIcon className="size-4" /> {game}
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      </div>

      <section className="rounded-xl border-2 border-ink bg-card p-5 shadow-[0_4px_0_0_var(--shadow-ink)]" aria-label="Tu resultado de hoy">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", result.won ? "bg-clue-exact-bg text-clue-exact" : "bg-muted text-margin")}>
            {result.won ? <CheckIcon className="size-6" /> : <XIcon className="size-6" />}
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold">{result.won ? "Ya lo resolviste" : "Hoy no salió"}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {result.won ? `${result.attempts} ${result.attempts === 1 ? "intento" : "intentos"} · ${formatTime(result.timeMs)}` : "Para el ranking cuenta la primera partida."}
            </p>
          </div>
        </div>
        {reveal && <div className="mt-5 flex justify-center">{reveal}</div>}
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Racha</dt>
            <dd className="flex items-center gap-1 font-display text-lg font-extrabold">
              <FlameIcon className="size-4 text-margin" aria-hidden /> {streak} {streak === 1 ? "día" : "días"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Próximo diario</dt>
            <dd className="font-display text-lg font-extrabold tabular-nums">{tomorrow ? "¡Ya está!" : `en ${untilTomorrow(now)}`}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-2">
        {tomorrow ? (
          <Button size="lg" className="h-12 w-full" onClick={() => location.reload()}>Jugar el de hoy</Button>
        ) : (
          <Button asChild size="lg" className="h-12 w-full">
            <Link href={`/ranking?juego=${gameId}`}>Ver ranking del día</Link>
          </Button>
        )}
        {!tomorrow && (
          <Button size="lg" variant="outline" className="h-12 w-full" onClick={onPractice}>
            <RotateCcwIcon /> Jugar de nuevo (práctica)
          </Button>
        )}
        <Button asChild size="lg" variant="ghost" className="h-12 w-full">
          <Link href={home}>Volver a {game}</Link>
        </Button>
      </div>
    </main>
  );
}
