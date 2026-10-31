"use client";

import Link from "next/link";
import { ArchiveIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, FlameIcon, PartyPopperIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { todayKey } from "@cranea/core";
import { accountsEnabled } from "@/components/account-provider";
import { archiveDate, dailiesFor, shortDate } from "@/components/daily-hub/dailies";
import { useAccountReady } from "@/components/progress-sync";
import { PlusGate } from "@/components/plus/paywall";
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
  /** Primer diario del juego (LAUNCH_DATE): desde ahí se pueden jugar fechas pasadas con `?fecha=`. */
  launch: string;
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
 * Con `?fecha=AAAA-MM-DD` (del archivo) se juega ese día como práctica; una fecha
 * inválida, futura o de hoy cae en el diario de hoy. Usa useSearchParams: va dentro de Suspense.
 */
export function DailyGate({ gameId, game, home, launch, title, reveal, children }: Props) {
  const requested = useSearchParams().get("fecha");
  const hydrated = useHydrated();
  const accountReady = useAccountReady((s) => s.ready);
  const [waited, setWaited] = useState(false);
  const [entry, setEntry] = useState<{ date: string; played: Result | null; archive: boolean; requested: string | null } | null>(null);
  const [practice, setPractice] = useState(false);
  const ready = hydrated && (!accountsEnabled || accountReady || waited);

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), ACCOUNT_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || (entry && entry.requested === requested)) return;
    const today = todayKey();
    const past = archiveDate(requested, launch, today);
    const date = past ?? today;
    setEntry({ date, played: useProgress.getState().games[gameId]?.daily[date] ?? null, archive: past !== null, requested });
  }, [ready, entry, gameId, requested, launch]);

  if (!entry) {
    return (
      <main className="mx-auto w-full max-w-md px-4 pt-4 text-muted-foreground" aria-busy>
        {hydrated && !ready ? "Buscando tus partidas…" : "Preparando el tablero…"}
      </main>
    );
  }
  if (entry.archive) {
    const played = entry.played;
    return (
      <>
        <div className="mx-auto mb-2 flex w-full max-w-md items-start justify-between gap-2 px-4 text-sm text-muted-foreground">
          <p role="status" className="flex min-w-0 items-start gap-2 pt-0.5">
            <ArchiveIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="font-semibold text-foreground">Diario del {shortDate(entry.date)}</span>
              {played && <> · {played.won ? "lo resolviste" : "no salió"}</>}
              <span className="block">Práctica: no se guarda ni cuenta.</span>
            </span>
          </p>
          <Link href={`${home}/archivo`} className="-my-2.5 inline-flex min-h-11 shrink-0 items-center rounded-md px-2 font-semibold text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-current">
            Archivo
          </Link>
        </div>
        {/* Los diarios anteriores son de Craneá Plus. */}
        <PlusGate reason="archive" daily={`${home}/diario`}>{children(entry.date, true)}</PlusGate>
      </>
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
  const games = useProgress((s) => s.games);
  const dailies = dailiesFor(games, date);
  const next = dailies.find((d) => !d.result);

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
        ) : next ? (
          <>
            <Button asChild size="lg" className="h-12 w-full">
              <Link href={next.href}>
                <span className="truncate">Siguiente diario: <span className="font-extrabold">{next.name}</span></span>
                <ChevronRightIcon aria-hidden className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 w-full">
              <Link href={`/ranking?juego=${gameId}`}>Ver ranking del día</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="py-1 text-center text-sm font-semibold">
              <PartyPopperIcon aria-hidden className="mr-1.5 inline size-4 align-[-3px] text-ok" />
              Jugaste los {dailies.length} diarios de hoy.{" "}
              <Link href="/" className="underline decoration-border decoration-2 underline-offset-4 hover:decoration-current">Compartir el día</Link>
            </p>
            <Button asChild size="lg" className="h-12 w-full">
              <Link href={`/ranking?juego=${gameId}`}>Ver ranking del día</Link>
            </Button>
          </>
        )}
        {!tomorrow && (
          <Button size="lg" variant="outline" className="h-12 w-full" onClick={onPractice}>
            <RotateCcwIcon /> Jugar de nuevo (práctica)
          </Button>
        )}
        <div className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-muted-foreground">
          <Link href={home} className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-md px-2 hover:text-foreground">
            <ChevronLeftIcon aria-hidden className="size-4" /> Volver a {game}
          </Link>
          <Link href={`${home}/archivo`} className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 hover:text-foreground">
            <ArchiveIcon aria-hidden className="size-4" /> Diarios anteriores
          </Link>
        </div>
      </div>
    </main>
  );
}
