"use client";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { todayKey, type GameMeta } from "@cranea/core";
import { AchievementIcon } from "@/components/achievement-icon";
import { useAchievementList } from "@/components/achievements-view";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatTime } from "@/lib/utils";
import { gameStats, useGameProgress } from "@/stores/progress";

/** Estadísticas de cada juego, calculadas con el progreso del dispositivo. */
export function StatsView({ games }: { games: GameMeta[] }) {
  const hydrated = useHydrated();
  return (
    <div className="space-y-10">
      {hydrated ? <AchievementsLink /> : <div className="h-[4.75rem]" />}
      {games.map((g) => (hydrated ? <GameStatsCard key={g.id} game={g} /> : <section key={g.id} className="h-64" />))}
    </div>
  );
}

/** Cuántos logros llevás, con los últimos conseguidos. */
function AchievementsLink() {
  const list = useAchievementList();
  const done = list.filter((a) => a.unlocked).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  return (
    <Link
      href="/logros"
      className="flex min-h-11 items-center gap-3 rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl font-extrabold">Logros</span>
        <span className="block text-sm text-muted-foreground tabular-nums">
          {done.length} de {list.length} conseguidos
        </span>
      </span>
      <span aria-hidden className="flex -space-x-2">
        {done.slice(0, 3).map((a) => (
          <span key={a.id} className="grid size-9 place-items-center rounded-full border-2 border-card bg-clue-present-bg text-clue-present">
            <AchievementIcon icon={a.icon} className="size-4" />
          </span>
        ))}
      </span>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function GameStatsCard({ game }: { game: GameMeta }) {
  const today = todayKey();
  const s = gameStats(useGameProgress(game.id), today);
  const rate = s.played ? Math.round((s.won / s.played) * 100) : 0;
  const buckets = Object.keys(s.attempts.counts).map(Number);
  const rows = Array.from({ length: Math.max(3, ...buckets) }, (_, i) => ({ label: String(i + 1), n: s.attempts.counts[i + 1] ?? 0 }));
  if (s.attempts.lost) rows.push({ label: "X", n: s.attempts.lost });
  const top = Math.max(1, ...rows.map((r) => r.n));

  return (
    <section id={game.id} aria-labelledby={`stats-${game.id}`} className="scroll-mt-20 rounded-xl border-2 border-ink bg-card p-5 shadow-[0_4px_0_0_var(--shadow-ink)]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`stats-${game.id}`} className="font-display text-2xl font-extrabold">
          {game.name}
        </h2>
        <Link href={`/ranking?juego=${game.id}`} className="font-semibold underline decoration-margin decoration-2 underline-offset-4">
          Ranking
        </Link>
      </div>

      {s.played === 0 ? (
        <p className="text-muted-foreground">
          Todavía no jugaste.{" "}
          <Link href={game.path} className="font-semibold text-foreground underline decoration-margin decoration-2 underline-offset-4">
            Empezá por acá
          </Link>
          .
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <Stat label="Partidas" value={s.played} />
            <Stat label="Ganadas" value={`${rate}%`} />
            <Stat label="Racha" value={s.streak} />
            <Stat label="Mejor racha" value={s.bestStreak} />
            <Stat label="Tiempo promedio" value={s.avgTimeMs === null ? "—" : formatTime(s.avgTimeMs)} />
            <Stat label="Mejor tiempo" value={s.bestTimeMs === null ? "—" : formatTime(s.bestTimeMs)} />
            <Stat label="Niveles completos" value={s.levelsCompleted} />
          </dl>

          <h3 className="mt-6 mb-2 font-semibold">Intentos en el diario</h3>
          <ol className="space-y-1.5">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-2 text-sm tabular-nums">
                <span className="w-3 text-right font-semibold" aria-hidden>{r.label}</span>
                <span className="flex-1">
                  <span
                    className="block h-6 min-w-7 rounded-sm bg-primary px-2 text-right leading-6 font-semibold text-primary-foreground"
                    style={{ width: `${(r.n / top) * 100}%` }}
                  >
                    <span className="sr-only">{r.label === "X" ? "Sin resolver" : `${r.label} ${r.label === "1" ? "intento" : "intentos"}`}: </span>
                    {r.n}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}
