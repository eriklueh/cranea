"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { todayKey, type GameMeta } from "@cranea/core";
import { api } from "../../convex/_generated/api";
import { OVERALL, POINTS, periodRange, shiftPeriod, type PeriodKind } from "../../convex/scoring";
import { accountsEnabled } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn, formatTime } from "@/lib/utils";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const PERIODS: { kind: PeriodKind; param: string; label: string }[] = [
  { kind: "day", param: "dia", label: "Día" },
  { kind: "week", param: "semana", label: "Semana" },
  { kind: "month", param: "mes", label: "Mes" },
];
const GENERAL = "general";

const short = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("es-AR", { ...opts, timeZone: "UTC" });

/** "Hoy", "30 de octubre", "Esta semana", "19 – 25 oct.", "Este mes", "Septiembre 2026" */
function periodLabel(kind: PeriodKind, date: string, today: string) {
  const { from, to } = periodRange(kind, date);
  const current = from <= today && today <= to;
  if (kind === "day") return current ? "Hoy" : short(date, { day: "numeric", month: "long" });
  if (kind === "week") {
    if (current) return "Esta semana";
    const sameMonth = from.slice(0, 7) === to.slice(0, 7);
    return `${short(from, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" })} – ${short(to, { day: "numeric", month: "short" })}`;
  }
  if (current) return "Este mes";
  const label = short(date, { month: "long", year: "numeric" }).replace(" de ", " ");
  return label[0].toUpperCase() + label.slice(1);
}

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};
const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

/**
 * Rankings en vivo: del día (por juego, por puesto) y por puntos del día, la semana y el mes
 * (por juego o General). Con sesión iniciada aparecés con tu nombre.
 */
export function RankingView({ games }: { games: GameMeta[] }) {
  const params = useSearchParams();
  const hydrated = useHydrated();
  if (!hydrated || !games.length) return <div className="h-96" />;

  const today = todayKey();
  const period = PERIODS.find((p) => p.param === params.get("periodo")) ?? PERIODS[0];
  const kind = period.kind;
  const game = games.find((g) => g.id === params.get("juego")) ?? null;
  const asked = params.get("fecha");
  const date = asked && DATE.test(asked) && asked <= today ? asked : today;
  const href = (p: { periodo?: string; juego?: string | null; fecha?: string }) => {
    const q = new URLSearchParams();
    const periodo = p.periodo ?? period.param;
    const juego = p.juego === undefined ? (game?.id ?? GENERAL) : (p.juego ?? GENERAL);
    const fecha = p.fecha ?? date;
    if (periodo !== "dia") q.set("periodo", periodo);
    q.set("juego", juego);
    if (fecha < today) q.set("fecha", fecha);
    return `/ranking?${q}`;
  };
  const range = periodRange(kind, date);
  const prev = shiftPeriod(kind, date, -1);
  const next = range.to < today ? (() => { const d = shiftPeriod(kind, date, 1); return d > today ? today : d; })() : null;
  const byPoints = kind !== "day" || !game;

  return (
    <div className="space-y-5">
      <nav aria-label="Período" className="grid grid-cols-3 gap-1 rounded-xl border-2 border-ink bg-card p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.param}
            href={href({ periodo: p.param })}
            aria-current={p === period ? "page" : undefined}
            className={cn(
              "grid h-11 place-items-center rounded-lg font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
              p === period ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <GameTabs games={[{ id: GENERAL, name: "General" }, ...games]} active={game?.id ?? GENERAL} href={(id) => href({ juego: id })} />

      <section aria-labelledby="board-title" className="rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-1">
          <Button asChild variant="ghost" size="icon" className="size-11">
            <Link href={href({ fecha: prev })} aria-label={`${period.label} anterior`}><ChevronLeftIcon className="size-5" /></Link>
          </Button>
          <h2 id="board-title" className="min-w-0 text-center font-display text-lg leading-tight font-extrabold min-[400px]:text-xl">
            <span className="block text-sm font-bold text-muted-foreground">{game?.name ?? "General"}</span>
            {periodLabel(kind, date, today)}
          </h2>
          {next ? (
            <Button asChild variant="ghost" size="icon" className="size-11">
              <Link href={href({ fecha: next })} aria-label={`${period.label} siguiente`}><ChevronRightIcon className="size-5" /></Link>
            </Button>
          ) : (
            <span className="size-11 shrink-0" aria-hidden />
          )}
        </div>
        {!accountsEnabled ? (
          <p className="text-muted-foreground">El ranking no está disponible en esta versión.</p>
        ) : byPoints ? (
          <PointsBoard key={`${game?.id}-${kind}-${range.from}`} gameId={game?.id ?? OVERALL} kind={kind} date={date} />
        ) : (
          <DayBoard key={`${game!.id}-${date}`} gameId={game!.id} date={date} />
        )}
      </section>

      {byPoints ? <ScoringRules general={!game} /> : <p className="text-sm text-muted-foreground">Primero quienes lo resolvieron, después menos intentos y menos tiempo.</p>}

      {accountsEnabled && <JoinRanking />}
    </div>
  );
}

/** Juegos en una fila que se desliza en el celular; el elegido queda a la vista. */
function GameTabs({ games, active, href }: { games: { id: string; name: string }[]; active: string; href: (id: string) => string }) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = nav.current;
    const current = el?.querySelector("[aria-current=page]");
    if (!el || !current) return;
    const a = current.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    if (a.left < box.left || a.right > box.right) el.scrollLeft += a.left - box.left - (box.width - a.width) / 2;
  }, [active]);
  return (
    <nav ref={nav} aria-label="Juegos" className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 pb-1">
        {games.map((g) => (
          <li key={g.id}>
            <Button asChild variant={g.id === active ? "default" : "outline"} className="h-11 px-4">
              <Link href={href(g.id)} aria-current={g.id === active ? "page" : undefined}>{g.name}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ScoringRules({ general }: { general: boolean }) {
  return (
    <details className="group rounded-xl border-2 border-dashed border-pencil/50 px-4 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        ¿Cómo se suman los puntos?
      </summary>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>Cada diario jugado con sesión suma {POINTS.played}, aunque no salga.</li>
        <li>Resolverlo suma {POINTS.won} más.</li>
        <li>Hasta {POINTS.attempts} más por intentos: todos con el primero, ninguno con el último.</li>
        <li>Hasta {POINTS.time} más por tiempo, que mide el servidor desde que abrís el tablero.</li>
        <li>
          Máximo 20 por diario{general ? ", y en el General se suman los 5 juegos" : ""}. Las semanas van de lunes a domingo y los días
          cambian a las 21 h de Argentina (medianoche UTC).
        </li>
        <li>Empate: más diarios resueltos, después menos tiempo total.</li>
      </ul>
    </details>
  );
}

type RowData = { rank: number; name: string; mine: boolean; value: string; detail: string };

function Board({ rows, me, total, capped, empty }: { rows: RowData[]; me: RowData | null; total: number; capped: boolean; empty: string }) {
  const online = useOnline();
  if (!rows.length) return <p className="py-2 text-muted-foreground">{online ? empty : "Sin conexión. El ranking vuelve cuando te conectes."}</p>;
  return (
    <>
      <ol className="divide-y divide-border">
        {rows.map((row) => <Row key={row.rank} row={row} />)}
        {me && (
          <>
            <li aria-hidden className="py-1 text-center text-muted-foreground">…</li>
            <Row row={me} />
          </>
        )}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">
        {capped ? `Más de ${total} jugadores` : `${total} ${total === 1 ? "jugador" : "jugadores"}`}
      </p>
    </>
  );
}

function Loading() {
  const online = useOnline();
  return <p className="py-2 text-muted-foreground">{online ? "Cargando…" : "Sin conexión. El ranking vuelve cuando te conectes."}</p>;
}

function PointsBoard({ gameId, kind, date }: { gameId: string; kind: PeriodKind; date: string }) {
  const data = useQuery(api.leaderboards.period, { gameId, kind, date });
  if (data === undefined) return <Loading />;
  const row = (r: (typeof data.top)[number]): RowData => ({
    rank: r.rank,
    name: r.name,
    mine: r.mine,
    value: `${r.points} pts`,
    detail: `${r.wins} de ${r.played} ${r.played === 1 ? "diario resuelto" : "diarios resueltos"}`,
  });
  return <Board rows={data.top.map(row)} me={data.me && row(data.me)} total={data.total} capped={data.capped} empty="Todavía no hay puntos en este período." />;
}

function DayBoard({ gameId, date }: { gameId: string; date: string }) {
  const data = useQuery(api.ranking.day, { gameId, date });
  if (data === undefined) return <Loading />;
  const row = (r: (typeof data.top)[number]): RowData => ({
    rank: r.rank,
    name: r.name,
    mine: r.mine,
    value: r.won ? formatTime(r.timeMs) : "—",
    detail: r.won ? `${r.attempts} ${r.attempts === 1 ? "intento" : "intentos"}` : "Sin resolver",
  });
  return <Board rows={data.top.map(row)} me={data.me && row(data.me)} total={data.total} capped={data.capped} empty="Todavía no hay resultados para este día." />;
}

function Row({ row }: { row: RowData }) {
  return (
    <li className={cn("flex min-h-14 items-center gap-3 py-2 tabular-nums", row.mine && "-mx-2 rounded-md bg-accent px-2")}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full font-display text-base font-extrabold",
          row.rank === 1 && "bg-clue-present-bg text-clue-present",
          row.rank <= 3 && row.rank > 1 && "bg-muted",
        )}
      >
        {row.rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate", row.mine && "font-semibold")}>
          {row.name}
          {row.mine && <span className="text-muted-foreground"> (vos)</span>}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{row.detail}</span>
      </span>
      <span className="shrink-0 font-display text-lg font-extrabold">{row.value}</span>
    </li>
  );
}

function JoinRanking() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.ranking.profile, isAuthenticated ? {} : "skip");
  const setRanked = useMutation(api.ranking.setRanked);
  const [busy, setBusy] = useState(false);

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <Panel text="Iniciá sesión antes de jugar el diario para aparecer en el ranking con tu nombre.">
        <SignInButton mode="modal">
          <Button className="h-11 w-full sm:w-auto">Iniciar sesión</Button>
        </SignInButton>
      </Panel>
    );
  }
  if (!profile) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      await setRanked({ ranked: !profile.ranked });
    } catch {
      /* sin conexión: queda como estaba */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      text={profile.ranked
        ? <>Aparecés como <strong className="text-foreground">{profile.name}</strong>. Cuenta la primera partida de cada diario, jugada con sesión; el tiempo corre desde que abrís el tablero.</>
        : "No aparecés en el ranking. Tus partidas se siguen guardando."}
    >
      <Button variant={profile.ranked ? "ghost" : "default"} className="h-11 w-full sm:w-auto" onClick={toggle} disabled={busy}>
        {profile.ranked ? "Ocultarme del ranking" : "Aparecer en el ranking"}
      </Button>
    </Panel>
  );
}

function Panel({ text, children }: { text: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-pencil/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <p className="text-muted-foreground">{text}</p>
      <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
    </div>
  );
}
