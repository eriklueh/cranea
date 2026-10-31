"use client";
import Link from "next/link";
import { CalendarClockIcon, CheckIcon, ChevronRightIcon, LockIcon, XIcon } from "lucide-react";
import { todayKey } from "@cranea/core";
import { useClock } from "@/components/game-home/use-clock";
import { PlusBadge, openPaywall } from "@/components/plus/paywall";
import { usePlus } from "@/lib/plus";
import { cn } from "@/lib/utils";
import { useGameProgress, type Result } from "@/stores/progress";
import { addDays, dayNumber, resultLine } from "./dailies";

const MONTH = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const LONG_DAY = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const utc = (date: string) => new Date(`${date}T00:00:00Z`);

/** Meses (más nuevo primero) con los días de `from` a `to`, incluidos. */
function months(from: string, to: string) {
  const out: { key: string; label: string; offset: number; days: string[] }[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const key = d.slice(0, 7);
    let m = out.at(-1);
    if (!m || m.key !== key) {
      // El primer día listado va en su columna; la semana empieza el lunes (getUTCDay() da 0 el domingo).
      const first = utc(d);
      m = { key, label: MONTH.format(first), offset: (first.getUTCDay() + 6) % 7, days: [] };
      out.push(m);
    }
    m.days.push(d);
  }
  return out.reverse();
}

/**
 * Calendario de diarios pasados de un juego, desde su lanzamiento hasta ayer, con tu resultado.
 * Tocar un día lo juega como práctica (`/<juego>/diario?fecha=`): no se guarda ni entra al ranking.
 * Jugar días pasados es de Craneá Plus; sin Plus se ve el calendario y tocar un día abre la hoja.
 */
export function ArchiveView({ gameId, home, launch }: { gameId: string; home: string; launch: string }) {
  const now = useClock(60_000);
  const progress = useGameProgress(gameId);
  const { plus } = usePlus();

  if (now === null) {
    return (
      <main className="mx-auto w-full max-w-md px-5 pt-1 pb-16" aria-busy>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Diarios anteriores</h1>
        <div className="mt-5 h-72 rounded-xl bg-muted motion-safe:animate-pulse" />
      </main>
    );
  }

  const today = todayKey(new Date(now));
  const yesterday = addDays(today, -1);
  const past = launch <= yesterday;
  const played = Object.entries(progress.daily).filter(([d]) => d >= launch && d < today);
  const won = played.filter(([, r]) => r.won).length;
  const total = past ? dayNumber(yesterday, launch) : 0;

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-1 pb-16">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Diarios anteriores</h1>
      <p className="mt-1 text-muted-foreground">Jugalos como práctica: no cambian tu racha ni el ranking.</p>
      {past && !plus && (
        <button
          type="button"
          onClick={() => openPaywall("archive")}
          aria-haspopup="dialog"
          className="mt-3 flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-left text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <PlusBadge className="shrink-0" />
          <span className="min-w-0 flex-1">Volver a jugar un día es parte de Craneá Plus.</span>
          <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-pencil" />
        </button>
      )}

      {!past ? (
        <div className="mt-5 rounded-xl border-2 border-dashed border-border bg-card p-4">
          <p className="flex items-start gap-2 font-semibold">
            <CalendarClockIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-pencil" />
            El primer diario es el de hoy. Desde mañana vas a poder volver a jugarlo acá.
          </p>
          <TodayLink home={home} />
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground tabular-nums">
            Jugaste <span className="font-semibold text-foreground">{played.length}</span> de {total} · resolviste{" "}
            <span className="font-semibold text-foreground">{won}</span>
          </p>
          <Legend />
          <div className="mt-2 grid gap-6">
            {months(launch, today).map((m) => (
              <section key={m.key} aria-labelledby={`mes-${m.key}`}>
                <h2 id={`mes-${m.key}`} className="mb-2 font-display text-lg font-extrabold first-letter:uppercase">
                  {m.label}
                </h2>
                <div aria-hidden className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-bold text-muted-foreground">
                  {WEEKDAYS.map((w, i) => (
                    <span key={i}>{w}</span>
                  ))}
                </div>
                <ol className="grid grid-cols-7 gap-1">
                  {m.days.map((d, i) => (
                    <li key={d} style={i === 0 ? { gridColumnStart: m.offset + 1 } : undefined}>
                      <DayCell gameId={gameId} date={d} today={d === today} result={progress.daily[d]} home={home} launch={launch} needsPlus={!plus} />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          <TodayLink home={home} />
        </>
      )}
    </main>
  );
}

function DayCell({ gameId, date, today, result, home, launch, needsPlus }: { gameId: string; date: string; today: boolean; result?: Result; home: string; launch: string; needsPlus: boolean }) {
  const day = Number(date.slice(8));
  const number = dayNumber(date, launch);
  const state = today ? "hoy" : !result ? "sin jugar" : result.won ? `resuelto, ${resultLine(gameId, result)}` : "no salió";
  const gated = needsPlus && !today;
  const label = `${LONG_DAY.format(utc(date))}, #${number}: ${state}${today ? "" : gated ? ". Jugar como práctica, con Craneá Plus" : ". Jugar como práctica"}`;
  const cls = cn(
    "relative grid aspect-square min-h-11 w-full place-items-center rounded-md font-display text-base font-bold tabular-nums outline-none transition-transform hover:-translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/50",
    today && "border-2 border-ink bg-card",
    !today && !result && "border-2 border-dashed border-border bg-card text-muted-foreground hover:border-ink hover:text-foreground",
    !today && result?.won && "bg-ok text-card",
    !today && result && !result.won && "border-2 border-margin bg-card text-margin",
  );
  const content = (
    <>
      {day}
      {!today && result && (
        <span aria-hidden className="absolute top-0.5 right-0.5">
          {result.won ? <CheckIcon className="size-3" strokeWidth={3.5} /> : <XIcon className="size-3" strokeWidth={3.5} />}
        </span>
      )}
      {gated && !result && <LockIcon aria-hidden className="absolute top-1 right-1 size-2.5 opacity-60" strokeWidth={2.75} />}
      {today && <span aria-hidden className="absolute bottom-0.5 text-[9px] leading-none font-bold tracking-wide uppercase">hoy</span>}
    </>
  );
  // Sin Plus, un día pasado abre la hoja de Plus en vez de jugarse.
  if (gated) {
    return (
      <button type="button" onClick={() => openPaywall("archive")} aria-label={label} title={label} aria-haspopup="dialog" className={cls}>
        {content}
      </button>
    );
  }
  return (
    <Link href={today ? `${home}/diario` : `${home}/diario?fecha=${date}`} aria-label={label} title={label} className={cls}>
      {content}
    </Link>
  );
}

function Legend() {
  const item = "inline-flex items-center gap-1.5";
  const dot = "inline-block size-3.5 rounded-[3px]";
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Referencias">
      <li className={item}>
        <span aria-hidden className={cn(dot, "bg-ok")} /> Resuelto
      </li>
      <li className={item}>
        <span aria-hidden className={cn(dot, "border-2 border-margin")} /> No salió
      </li>
      <li className={item}>
        <span aria-hidden className={cn(dot, "border-2 border-dashed border-border")} /> Sin jugar
      </li>
    </ul>
  );
}

function TodayLink({ home }: { home: string }) {
  return (
    <Link
      href={`${home}/diario`}
      className="group mt-6 flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-4 py-2 font-semibold outline-none hover:border-ink focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      El diario de hoy
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-pencil transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
