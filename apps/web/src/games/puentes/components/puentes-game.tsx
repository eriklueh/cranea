"use client";
import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, RotateCcwIcon, Undo2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PuentesPuzzle } from "@cranea/core/puentes";
import { FinishSlot } from "@/components/finish-slot";
import { Button } from "@/components/ui/button";
import { WIN_RESULT_MS } from "@/lib/motion";
import { useProgress } from "@/stores/progress";
import { GAME_ID, levelKey } from "../data";
import { attemptsOf, usePuentes, type Notice } from "../store";
import { PuentesBoard } from "./board";
import { mistakesText, ResultDialog, type GameMode } from "./result-dialog";
import { Timer } from "./timer";
import type { TutorialMode } from "@/components/tutorial/mode";

function noticeText(n: Notice, status: string) {
  if (status === "won") return "Todas las islas quedaron conectadas.";
  if (status === "review") return "Ya jugaste el de hoy. Esta es la solución; mañana hay otro.";
  if (!n) return "";
  if (n.kind === "blocked") return "Ese puente cruzaría otro.";
  if (n.kind === "wrong") return n.count === 1 ? "Hay un puente de más. Quedó marcado en rojo." : `Hay ${n.count} puentes de más. Quedaron marcados en rojo.`;
  return n.missing === 1 ? "Vas bien. Falta un puente." : `Vas bien. Faltan ${n.missing} puentes.`;
}

export function PuentesGame({ puzzle, mode, alreadyPlayed = false }: { puzzle: PuentesPuzzle; mode: GameMode | TutorialMode; alreadyPlayed?: boolean }) {
  const start = usePuentes((s) => s.start);
  const review = usePuentes((s) => s.review);
  const current = usePuentes((s) => s.puzzle);
  const status = usePuentes((s) => s.status);
  const mistakes = usePuentes((s) => s.mistakes);
  const notice = usePuentes((s) => s.notice);
  const canUndo = usePuentes((s) => s.history.length > 0);
  const hasBridges = usePuentes((s) => s.bridges.some((b) => b > 0));
  const { undo, reset, check } = usePuentes.getState();
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (alreadyPlayed) review(puzzle);
    else start(puzzle);
    recorded.current = false;
    setResultOpen(false);
  }, [puzzle, alreadyPlayed, start, review]);

  // Deshacer con Ctrl/Cmd + Z.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || e.shiftKey) return;
      if (e.target instanceof Element && e.target.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      usePuentes.getState().undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (status !== "won" || recorded.current || current !== puzzle || mode.kind === "tutorial") return;
    recorded.current = true;
    const s = usePuentes.getState();
    const result = { won: true, attempts: attemptsOf(s.mistakes), timeMs: (s.finishedAt ?? Date.now()) - s.startedAt, at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    else if (!mode.practice) p.recordDaily(GAME_ID, mode.date, result);
    const t = setTimeout(() => setResultOpen(true), WIN_RESULT_MS);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "tutorial" ? "Tutorial" : mode.kind === "daily" ? `Puentes del día #${mode.number}` : `Nivel ${mode.level}`;
  const subtitle = mode.kind === "tutorial" ? "Puentes" : mode.kind === "daily" ? "Mismo tablero para todos" : `Mundo ${mode.world}`;
  const message = noticeText(notice, status);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Link href="/puentes" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> {subtitle}
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        </div>
        {status !== "review" && (
          <div className="flex items-center gap-4 pb-1 text-sm font-semibold">
            <span className={mistakes ? "text-margin" : undefined}>{mistakes === 0 ? "Sin errores" : mistakes === 1 ? "1 error" : `${mistakes} errores`}</span>
            <Timer />
          </div>
        )}
      </div>

      <section aria-label="Tablero" className="anim-appear mb-3">
        <PuentesBoard puzzle={puzzle} />
      </section>

      <p aria-live="polite" className={`mb-4 min-h-6 text-center text-sm ${notice?.kind === "wrong" ? "text-margin" : "text-muted-foreground"}`}>
        {message}
      </p>

      {status === "review" ? (
        <div className="flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/puentes">Volver a los mundos</Link>
          </Button>
        </div>
      ) : (
        // Al ganar, "Ver resultado" ocupa el lugar de los controles sin cambiar el alto de la página.
        <FinishSlot
          finished={status === "won"}
          done={
            <button className="min-h-11 text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setResultOpen(true)}>
              Ver resultado ({mistakesText(mistakes)})
            </button>
          }
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="lg" onClick={undo} disabled={!canUndo}>
              <Undo2Icon /> Deshacer
            </Button>
            <Button variant="outline" size="lg" onClick={reset} disabled={!hasBridges}>
              <RotateCcwIcon /> Empezar de nuevo
            </Button>
            <Button size="lg" onClick={check} disabled={!hasBridges}>
              <CheckIcon /> Revisar
            </Button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Deslizá desde una isla o tocá dos islas para tender un puente. Tocá el puente para sumar el segundo o sacarlo.
          </p>
        </FinishSlot>
      )}

      {mode.kind !== "tutorial" && <ResultDialog open={resultOpen} onOpenChange={setResultOpen} mode={mode} />}
    </main>
  );
}
