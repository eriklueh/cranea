"use client";
import { useMemo } from "react";
import { CheckIcon, LockIcon } from "lucide-react";
import type { AchievementState } from "@cranea/core/achievements";
import { AchievementIcon } from "@/components/achievement-icon";
import { useHydrated } from "@/hooks/use-hydrated";
import { evaluate } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { useAchievements } from "@/stores/achievements";
import { useProgress } from "@/stores/progress";

const formatDate = (ms: number) => {
  const d = new Date(ms);
  const year = d.getFullYear() === new Date().getFullYear() ? undefined : "numeric";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year });
};

/** Logros con su estado: los desbloqueados con fecha y los que faltan con su avance. */
export function useAchievementList() {
  const games = useProgress((s) => s.games);
  const unlocked = useAchievements((s) => s.unlocked);
  const states = useMemo(() => evaluate(games), [games]);
  return states.map((a) => {
    const at = unlocked[a.id] ?? a.at;
    return { ...a, unlocked: a.unlocked || unlocked[a.id] !== undefined, at };
  });
}

export function AchievementsView() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-96" />;
  return <AchievementsList />;
}

function AchievementsList() {
  const list = useAchievementList();
  const done = list.filter((a) => a.unlocked).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  const pending = list.filter((a) => !a.unlocked).sort((a, b) => b.value / b.goal - a.value / a.goal);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)]">
        <p className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">Desbloqueados</span>
          <span className="font-display text-2xl font-extrabold tabular-nums">
            {done.length}<span className="text-base text-muted-foreground"> de {list.length}</span>
          </span>
        </p>
        <Bar value={done.length} goal={list.length} label="Logros desbloqueados" className="mt-2 h-3" />
      </div>

      {done.length > 0 && (
        <Section title="Conseguidos">
          {done.map((a) => <Card key={a.id} a={a} />)}
        </Section>
      )}
      {pending.length > 0 && (
        <Section title="Por conseguir">
          {pending.map((a) => <Card key={a.id} a={a} />)}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-extrabold">{title}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</ul>
    </section>
  );
}

function Card({ a }: { a: AchievementState }) {
  const counter = a.goal > 1;
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2 p-3",
        a.unlocked ? "border-ink bg-card shadow-[0_3px_0_0_var(--shadow-ink)]" : "border-dashed border-pencil/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full",
            a.unlocked ? "bg-clue-present-bg text-clue-present" : "bg-muted text-muted-foreground",
          )}
        >
          <AchievementIcon icon={a.icon} className="size-6" />
        </span>
        {a.unlocked ? (
          <CheckIcon aria-hidden className="size-5 text-ok" strokeWidth={3} />
        ) : (
          <LockIcon aria-hidden className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <h3 className={cn("font-display text-base leading-tight font-extrabold", !a.unlocked && "text-muted-foreground")}>
          {a.name}
          <span className="sr-only">{a.unlocked ? " (conseguido)" : " (bloqueado)"}</span>
        </h3>
        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{a.description}</p>
      </div>
      <div className="mt-auto text-xs font-semibold text-muted-foreground tabular-nums">
        {a.unlocked ? (
          a.at ? <>Conseguido el {formatDate(a.at)}</> : null
        ) : counter ? (
          <>
            <Bar value={a.value} goal={a.goal} label={`Avance de ${a.name}`} className="mb-1 h-1.5" />
            {a.value} / {a.goal}
          </>
        ) : null}
      </div>
    </li>
  );
}

function Bar({ value, goal, label, className }: { value: number; goal: number; label: string; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={value}
      className={cn("overflow-hidden rounded-full bg-muted", className)}
    >
      <div className="h-full rounded-full bg-ok" style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
    </div>
  );
}
