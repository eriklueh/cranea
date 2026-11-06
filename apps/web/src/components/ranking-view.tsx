"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { todayKey, type GameMeta } from "@cranea/core";
import { intlLocale, type Locale } from "@cranea/core/i18n";
import { api } from "../../convex/_generated/api";
import { OVERALL, POINTS, periodRange, shiftPeriod, type PeriodKind } from "../../convex/scoring";
import { accountsEnabled } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocale, useT, useVisibleGames, type T } from "@/lib/i18n";
import { cn, formatTime } from "@/lib/utils";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const PERIODS: { kind: PeriodKind; param: string; label: "stats.day" | "stats.week" | "stats.month" }[] = [
  { kind: "day", param: "dia", label: "stats.day" },
  { kind: "week", param: "semana", label: "stats.week" },
  { kind: "month", param: "mes", label: "stats.month" },
];
const GENERAL = "general";

/** "Hoy", "30 de octubre", "Esta semana", "19 – 25 oct.", "Este mes", "Septiembre 2026" (en inglés: "Oct 19 – 25"). */
function periodLabel(kind: PeriodKind, date: string, today: string, t: T, locale: Locale) {
  const short = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString(intlLocale(locale), { ...opts, timeZone: "UTC" });
  const { from, to } = periodRange(kind, date);
  const current = from <= today && today <= to;
  if (kind === "day") return current ? t("common.today") : short(date, { day: "numeric", month: "long" });
  if (kind === "week") {
    if (current) return t("stats.thisWeek");
    const sameMonth = from.slice(0, 7) === to.slice(0, 7);
    if (locale === "en") {
      return `${short(from, { day: "numeric", month: "short" })} – ${short(to, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" })}`;
    }
    return `${short(from, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" })} – ${short(to, { day: "numeric", month: "short" })}`;
  }
  if (current) return t("stats.thisMonth");
  const label = short(date, { month: "long", year: "numeric" }).replace(" de ", " ");
  return label[0].toUpperCase() + label.slice(1);
}

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};
const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

/** Título y bajada de /ranking (la página es del servidor). */
export function RankingHeader() {
  const t = useT();
  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("common.ranking")}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("stats.rankingIntro")}</p>
    </div>
  );
}

/**
 * Rankings en vivo: del día (por juego, por puesto) y por puntos del día, la semana y el mes
 * (por juego o General). Con sesión iniciada aparecés con tu nombre.
 */
export function RankingView({ games: all }: { games: GameMeta[] }) {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const t = useT();
  const locale = useLocale();
  // Sin Palabra en inglés; el General (datos del servidor) no cambia.
  const games = useVisibleGames(all);
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
      <nav aria-label={t("stats.periodNav")} className="grid grid-cols-3 gap-1 rounded-xl border-2 border-ink bg-card p-1">
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
            {t(p.label)}
          </Link>
        ))}
      </nav>

      <GameTabs games={[{ id: GENERAL, name: t("stats.general") }, ...games]} active={game?.id ?? GENERAL} href={(id) => href({ juego: id })} />

      <section aria-labelledby="board-title" className="rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-1">
          <Button asChild variant="ghost" size="icon" className="size-11">
            <Link href={href({ fecha: prev })} aria-label={t("stats.previous", { period: t(period.label) })}><ChevronLeftIcon className="size-5" /></Link>
          </Button>
          <h2 id="board-title" className="min-w-0 text-center font-display text-lg leading-tight font-extrabold min-[400px]:text-xl">
            <span className="block text-sm font-bold text-muted-foreground">{game?.name ?? t("stats.general")}</span>
            {periodLabel(kind, date, today, t, locale)}
          </h2>
          {next ? (
            <Button asChild variant="ghost" size="icon" className="size-11">
              <Link href={href({ fecha: next })} aria-label={t("stats.next", { period: t(period.label) })}><ChevronRightIcon className="size-5" /></Link>
            </Button>
          ) : (
            <span className="size-11 shrink-0" aria-hidden />
          )}
        </div>
        {!accountsEnabled ? (
          <p className="text-muted-foreground">{t("stats.unavailable")}</p>
        ) : byPoints ? (
          <PointsBoard key={`${game?.id}-${kind}-${range.from}`} gameId={game?.id ?? OVERALL} kind={kind} date={date} />
        ) : (
          <DayBoard key={`${game!.id}-${date}`} gameId={game!.id} date={date} />
        )}
      </section>

      {byPoints ? <ScoringRules general={!game} /> : <p className="text-sm text-muted-foreground">{t("stats.dayOrder")}</p>}

      {accountsEnabled && <JoinRanking />}
    </div>
  );
}

/** Juegos en una fila que se desliza en el celular; el elegido queda a la vista. */
function GameTabs({ games, active, href }: { games: { id: string; name: string }[]; active: string; href: (id: string) => string }) {
  const t = useT();
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
    <nav ref={nav} aria-label={t("stats.gamesNav")} className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
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
  const t = useT();
  return (
    <details className="group rounded-xl border-2 border-dashed border-pencil/50 px-4 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        {t("stats.howPoints")}
      </summary>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>{t("stats.rulePlayed", { n: POINTS.played })}</li>
        <li>{t("stats.ruleWon", { n: POINTS.won })}</li>
        <li>{t("stats.ruleAttempts", { n: POINTS.attempts })}</li>
        <li>{t("stats.ruleTime", { n: POINTS.time })}</li>
        <li>{general ? t("stats.ruleCapGeneral") : t("stats.ruleCap")}</li>
        <li>{t("stats.ruleTie")}</li>
      </ul>
    </details>
  );
}

type RowData = { rank: number; name: string; mine: boolean; value: string; detail: string };

function Board({ rows, me, total, capped, empty }: { rows: RowData[]; me: RowData | null; total: number; capped: boolean; empty: string }) {
  const online = useOnline();
  const t = useT();
  if (!rows.length) return <p className="py-2 text-muted-foreground">{online ? empty : t("stats.offline")}</p>;
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
        {capped ? t("stats.playersMore", { count: total }) : t("stats.players", { count: total })}
      </p>
    </>
  );
}

function Loading() {
  const online = useOnline();
  const t = useT();
  return <p className="py-2 text-muted-foreground">{online ? t("common.loading") : t("stats.offline")}</p>;
}

function PointsBoard({ gameId, kind, date }: { gameId: string; kind: PeriodKind; date: string }) {
  const t = useT();
  const data = useQuery(api.leaderboards.period, { gameId, kind, date });
  if (data === undefined) return <Loading />;
  const row = (r: (typeof data.top)[number]): RowData => ({
    rank: r.rank,
    name: r.name,
    mine: r.mine,
    value: t("stats.points", { count: r.points }),
    detail: t("stats.solvedOf", { wins: r.wins, count: r.played }),
  });
  return <Board rows={data.top.map(row)} me={data.me && row(data.me)} total={data.total} capped={data.capped} empty={t("stats.emptyPeriod")} />;
}

function DayBoard({ gameId, date }: { gameId: string; date: string }) {
  const t = useT();
  const data = useQuery(api.ranking.day, { gameId, date });
  if (data === undefined) return <Loading />;
  const row = (r: (typeof data.top)[number]): RowData => ({
    rank: r.rank,
    name: r.name,
    mine: r.mine,
    value: r.won ? formatTime(r.timeMs) : "—",
    detail: r.won ? t("common.attempts", { count: r.attempts }) : t("stats.unsolved"),
  });
  return <Board rows={data.top.map(row)} me={data.me && row(data.me)} total={data.total} capped={data.capped} empty={t("stats.emptyDay")} />;
}

function Row({ row }: { row: RowData }) {
  const t = useT();
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
          {row.mine && <span className="text-muted-foreground">{t("stats.you")}</span>}
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
  const t = useT();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <Panel text={t("stats.signInPrompt")}>
        <SignInButton mode="modal">
          <Button className="h-11 w-full sm:w-auto">{t("stats.signIn")}</Button>
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
        ? <>{t("stats.rankedAs")} <strong className="text-foreground">{profile.name}</strong>{t("stats.rankedRules")}</>
        : t("stats.notRanked")}
    >
      <Button variant={profile.ranked ? "ghost" : "default"} className="h-11 w-full sm:w-auto" onClick={toggle} disabled={busy}>
        {profile.ranked ? t("stats.hideMe") : t("stats.showMe")}
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
