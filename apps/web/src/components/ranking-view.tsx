"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { todayKey, type GameMeta } from "@cranea/core";
import { api } from "../../convex/_generated/api";
import { accountsEnabled } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn, formatTime } from "@/lib/utils";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function shift(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "UTC" });
}

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};
const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

/** Ranking diario de cada juego. Se lee en vivo; con sesión iniciada aparecés con tu nombre. */
export function RankingView({ games }: { games: GameMeta[] }) {
  const params = useSearchParams();
  const hydrated = useHydrated();
  if (!hydrated || !games.length) return null;

  const today = todayKey();
  const game = games.find((g) => g.id === params.get("juego")) ?? games[0];
  const asked = params.get("fecha");
  const date = asked && DATE.test(asked) && asked <= today ? asked : today;
  const href = (gameId: string, d: string) => `/ranking?juego=${gameId}${d === today ? "" : `&fecha=${d}`}`;

  return (
    <div className="space-y-6">
      {games.length > 1 && (
        <nav aria-label="Juegos" className="flex flex-wrap gap-2">
          {games.map((g) => (
            <Button key={g.id} asChild size="sm" variant={g.id === game.id ? "default" : "outline"}>
              <Link href={href(g.id, date)} aria-current={g.id === game.id ? "page" : undefined}>{g.name}</Link>
            </Button>
          ))}
        </nav>
      )}

      <section className="rounded-xl border-2 border-ink bg-card p-5 shadow-[0_4px_0_0_var(--shadow-ink)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href={href(game.id, shift(date, -1))} aria-label="Día anterior"><ChevronLeftIcon /></Link>
          </Button>
          <h2 className="text-center font-display text-xl font-extrabold">
            {game.name} · {date === today ? "Hoy" : formatDate(date)}
          </h2>
          {date < today ? (
            <Button asChild variant="ghost" size="icon">
              <Link href={href(game.id, shift(date, 1))} aria-label="Día siguiente"><ChevronRightIcon /></Link>
            </Button>
          ) : (
            <span className="size-10" aria-hidden />
          )}
        </div>
        {accountsEnabled ? (
          <Leaderboard key={`${game.id}-${date}`} gameId={game.id} date={date} />
        ) : (
          <p className="text-muted-foreground">El ranking no está disponible en esta versión.</p>
        )}
      </section>

      {accountsEnabled && <JoinRanking />}
    </div>
  );
}

function Leaderboard({ gameId, date }: { gameId: string; date: string }) {
  const data = useQuery(api.ranking.day, { gameId, date });
  const online = useOnline();

  if (data === undefined) {
    return <p className="text-muted-foreground">{online ? "Cargando…" : "Sin conexión. El ranking vuelve cuando te conectes."}</p>;
  }
  if (!data.top.length) return <p className="text-muted-foreground">Todavía no hay resultados para este día.</p>;

  return (
    <>
      <ol className="divide-y divide-border">
        {data.top.map((row) => <Row key={row.rank} row={row} />)}
        {data.me && (
          <>
            <li aria-hidden className="py-1 text-center text-muted-foreground">…</li>
            <Row row={data.me} />
          </>
        )}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">
        {data.capped ? `Más de ${data.total} jugadores` : `${data.total} ${data.total === 1 ? "jugador" : "jugadores"}`}
      </p>
    </>
  );
}

type RowData = { rank: number; name: string; won: boolean; attempts: number; timeMs: number; mine: boolean };

function Row({ row }: { row: RowData }) {
  return (
    <li className={cn("flex items-center gap-3 py-2 tabular-nums", row.mine && "-mx-2 rounded-md bg-accent px-2 font-semibold")}>
      <span className="w-8 text-right font-display text-lg font-extrabold">{row.rank}</span>
      <span className="min-w-0 flex-1 truncate">
        {row.name}
        {row.mine && <span className="text-muted-foreground"> (vos)</span>}
      </span>
      <span className="text-sm text-muted-foreground">
        {row.won ? `${row.attempts} ${row.attempts === 1 ? "intento" : "intentos"} · ${formatTime(row.timeMs)}` : "Sin resolver"}
      </span>
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
      <Panel text="Iniciá sesión para aparecer en el ranking con tu nombre.">
        <SignInButton mode="modal">
          <Button className="w-full sm:w-auto">Iniciar sesión</Button>
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
        ? <>Aparecés como <strong className="text-foreground">{profile.name}</strong>. Solo cuenta la primera partida de cada diario.</>
        : "No aparecés en el ranking. Tus partidas se siguen guardando."}
    >
      <Button variant={profile.ranked ? "ghost" : "default"} className="w-full sm:w-auto" onClick={toggle} disabled={busy}>
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
