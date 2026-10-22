"use client";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CifraPuzzle } from "@cranea/core/cifra";
import { useProgress } from "@/stores/progress";
import { levelKey } from "../data";
import { MAX_ATTEMPTS, useCifra } from "../store";
import { ClueRow } from "./clue-row";
import { InputSlots, Keypad } from "./keypad";
import { Lives } from "./lives";
import { ResultDialog, type GameMode } from "./result-dialog";
import { Timer } from "./timer";
import { DrawingBoard } from "./drawing-board";

export function CifraGame({ puzzle, mode }: { puzzle: CifraPuzzle; mode: GameMode }) {
  const start = useCifra((s) => s.start);
  const current = useCifra((s) => s.puzzle);
  const status = useCifra((s) => s.status);
  const misses = useCifra((s) => s.misses);
  const marks = useCifra((s) => s.marks);
  const cycleMark = useCifra((s) => s.cycleMark);
  const [resultOpen, setResultOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawingSession, setDrawingSession] = useState(0);
  const recorded = useRef(false);

  useEffect(() => {
    start(puzzle);
    setDrawing(false);
    recorded.current = false;
  }, [puzzle, start]);

  // Teclado físico.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (drawing) {
        if (e.key === "Escape") { e.preventDefault(); setDrawing(false); }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('[role="dialog"], [data-drawing-controls], input, textarea, select, [contenteditable="true"]')) return;
      const s = useCifra.getState();
      if (/^[0-9]$/.test(e.key)) s.press(Number(e.key));
      else if (e.key === "Backspace") s.backspace();
      else if (e.key === "Enter") {
        // Enter en una ficha conserva la activación nativa del botón; no envía el código.
        if (e.target instanceof Element && e.target.closest("[data-clue-tile]")) return;
        e.preventDefault();
        s.submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing]);

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = useCifra.getState();
    const result = {
      won: status === "won",
      attempts: status === "won" ? s.misses.length + 1 : MAX_ATTEMPTS,
      timeMs: (s.finishedAt ?? Date.now()) - s.startedAt,
      at: Date.now(),
    };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel("cifra", levelKey(mode.world, mode.level), result);
    else p.recordDaily("cifra", mode.date, result);
    const t = setTimeout(() => setResultOpen(true), status === "won" ? 450 : 250);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "daily" ? `Cifra del día #${mode.number}` : `Nivel ${mode.level}`;
  const subtitle = mode.kind === "daily" ? "Mismo tablero para todos" : `Mundo ${mode.world}`;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Link href="/cifra" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> {subtitle}
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-4 pb-1 text-sm font-semibold">
          <Lives />
          <Timer />
        </div>
      </div>

      <DrawingBoard key={`${puzzle.id}:${drawingSession}`} active={drawing} onActiveChange={setDrawing}>
      <section aria-label="Pistas" className="mb-4">
        <ol className="space-y-2.5">
          {puzzle.clues.map((c, i) => (
            <ClueRow key={i} clue={c} marks={marks} row={i} interactive disabled={status !== "playing"} onCycleMark={cycleMark} />
          ))}
          {misses.map((c, i) => (
            <ClueRow key={`m${i}`} clue={c} marks={marks} row={puzzle.clues.length + i} miss interactive disabled={status !== "playing"} onCycleMark={cycleMark} />
          ))}
        </ol>
      </section>

      <section aria-label="Tu código" className="space-y-3">
        <div className="flex flex-col items-center gap-3">
          <InputSlots />
          {status !== "playing" && (
            <button className="text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setResultOpen(true)}>
              Ver resultado
            </button>
          )}
        </div>
        <Keypad />
      </section>
      </DrawingBoard>

      <ResultDialog open={resultOpen} onOpenChange={setResultOpen} mode={mode} onRetry={() => {
        setResultOpen(false);
        setDrawing(false);
        setDrawingSession((session) => session + 1);
        recorded.current = false;
        start(puzzle);
      }} />
    </main>
  );
}
