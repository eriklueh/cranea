"use client";
import Link from "next/link";
import { ChevronLeftIcon, EraserIcon, PaintBucketIcon, SearchCheckIcon, Undo2Icon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { NonogramaPuzzle } from "@cranea/core/nonograma";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { useProgress } from "@/stores/progress";
import { GAME_ID, levelKey } from "../data";
import { attemptsOf, MAX_ATTEMPTS, MAX_CHECKS, useNonograma } from "../store";
import { Board } from "./board";
import { ResultDialog, type GameMode } from "./result-dialog";

export function NonogramaGame({ puzzle, mode }: { puzzle: NonogramaPuzzle; mode: GameMode }) {
  const start = useNonograma((s) => s.start);
  const current = useNonograma((s) => s.puzzle);
  const status = useNonograma((s) => s.status);
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    start(puzzle);
    recorded.current = false;
  }, [puzzle, start]);

  // Atajos: deshacer con Ctrl/Cmd+Z o U, cambiar de herramienta con C.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || (e.target instanceof Element && e.target.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]'))) return;
      const s = useNonograma.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        s.undo();
      } else if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "u") s.undo();
      else if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "c") s.setTool(s.tool === "fill" ? "cross" : "fill");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = useNonograma.getState();
    const result = { won: status === "won", attempts: attemptsOf(s), timeMs: (s.finishedAt ?? Date.now()) - s.startedAt, at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    else p.recordDaily(GAME_ID, mode.date, result);
    const t = setTimeout(() => setResultOpen(true), status === "won" ? 900 : 400);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "daily" ? `Nonograma del día #${mode.number}` : `Nivel ${mode.level}`;
  const subtitle = mode.kind === "daily" ? "Mismo tablero para todos" : `Mundo ${mode.world} · ${puzzle.width}×${puzzle.height}`;

  return (
    <main className={cn("mx-auto w-full px-2 pb-10 sm:px-4", puzzle.width >= 15 ? "max-w-xl" : "max-w-md")}>
      <div className="mb-4 flex items-end justify-between gap-4 px-2">
        <div>
          <Link href="/nonograma" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> {subtitle}
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-4 pb-1 text-sm font-semibold">
          <ChecksLeft />
          <Timer />
        </div>
      </div>

      <Board puzzle={puzzle} />
      <Reveal mode={mode.kind} />

      {status === "playing" ? (
        <Controls />
      ) : (
        <div className="mt-6 flex justify-center">
          <button className="min-h-11 text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setResultOpen(true)}>
            Ver resultado
          </button>
        </div>
      )}

      <ResultDialog
        open={resultOpen}
        onOpenChange={setResultOpen}
        mode={mode}
        onRetry={() => {
          setResultOpen(false);
          recorded.current = false;
          start(puzzle);
        }}
      />
    </main>
  );
}

function Reveal({ mode }: { mode: GameMode["kind"] }) {
  const status = useNonograma((s) => s.status);
  const title = useNonograma((s) => s.puzzle?.title);
  const lastCheck = useNonograma((s) => s.lastCheck);
  let text = "";
  if (status === "won") text = mode === "daily" ? "Dibujo completo." : `Dibujo completo: ${title}.`;
  else if (status === "lost") text = mode === "daily" ? "Esta era la solución." : `Era: ${title}.`;
  else if (lastCheck !== null) text = lastCheck === 0 ? "Todo bien hasta acá." : `${lastCheck} ${lastCheck === 1 ? "casilla no va" : "casillas no van"} así. Están marcadas en rojo.`;
  return (
    <p aria-live="polite" className={cn("mt-3 min-h-6 text-center font-semibold", status === "won" ? "font-display text-xl text-ok" : lastCheck ? "text-margin" : "text-muted-foreground")}>
      {text}
    </p>
  );
}

function Controls() {
  const tool = useNonograma((s) => s.tool);
  const setTool = useNonograma((s) => s.setTool);
  const canUndo = useNonograma((s) => s.history.length > 0);
  const canReset = useNonograma((s) => s.board.some((c) => c !== 0));
  const checks = useNonograma((s) => s.checks);
  const { undo, reset, check, giveUp } = useNonograma.getState();
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);

  useEffect(() => {
    if (!confirmGiveUp) return;
    const t = setTimeout(() => setConfirmGiveUp(false), 4000);
    return () => clearTimeout(t);
  }, [confirmGiveUp]);

  return (
    <div className="mt-2 space-y-4 px-2">
      <div role="group" aria-label="Herramienta" className="mx-auto grid max-w-xs grid-cols-2 rounded-lg border-2 border-ink bg-card p-1 shadow-[0_3px_0_0_var(--shadow-ink)]">
        {(["fill", "cross"] as const).map((t) => (
          <button
            key={t}
            aria-pressed={tool === t}
            onClick={() => setTool(t)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-md font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              tool === t ? "bg-ink text-paper" : "hover:bg-accent",
            )}
          >
            {t === "fill" ? <PaintBucketIcon className="size-4" /> : <XIcon className="size-4" />}
            {t === "fill" ? "Pintar" : "Cruz"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" className="min-h-11" onClick={undo} disabled={!canUndo}>
          <Undo2Icon /> Deshacer
        </Button>
        <Button variant="outline" className="min-h-11" onClick={reset} disabled={!canReset}>
          <EraserIcon /> Borrar todo
        </Button>
        <Button variant="outline" className="min-h-11" onClick={check} disabled={checks >= MAX_CHECKS || !canReset}>
          <SearchCheckIcon /> Revisar ({MAX_CHECKS - checks})
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Revisar marca lo que está mal y suma un intento.{" "}
        <button
          className="min-h-11 font-semibold underline decoration-margin decoration-2 underline-offset-4"
          onClick={() => (confirmGiveUp ? giveUp() : setConfirmGiveUp(true))}
        >
          {confirmGiveUp ? "¿Seguro? Ver solución" : "Me rindo"}
        </button>
      </p>
    </div>
  );
}

function ChecksLeft() {
  const status = useNonograma((s) => s.status);
  const checks = useNonograma((s) => s.checks);
  const attempts = attemptsOf({ status, checks });
  const left = status === "lost" ? 0 : MAX_ATTEMPTS - checks;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Intento ${attempts} de ${MAX_ATTEMPTS}`}>
      {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
        <span key={i} className={cn("h-4 w-1.5 rounded-full transition-[background-color,scale] duration-300 ease-out", i < left ? "bg-ink" : "scale-y-60 bg-margin/40")} />
      ))}
    </span>
  );
}

function Timer() {
  const startedAt = useNonograma((s) => s.startedAt);
  const finishedAt = useNonograma((s) => s.finishedAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finishedAt, startedAt]);
  if (!startedAt) return <span className="tabular-nums">0:00</span>;
  return <span className="tabular-nums">{formatTime(Math.max(0, (finishedAt ?? now) - startedAt))}</span>;
}
