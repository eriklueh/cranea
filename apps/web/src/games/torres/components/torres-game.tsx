"use client";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TorresPuzzle } from "@cranea/core/torres";
import { useProgress } from "@/stores/progress";
import { GAME_ID, levelKey } from "../data";
import { attemptsOf, useTorres } from "../store";
import { Board } from "./board";
import { CheckMessage, Lives, NumberPad, Timer, Toolbar } from "./controls";
import { ResultDialog, type GameMode } from "./result-dialog";

const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

export function TorresGame({ puzzle, mode }: { puzzle: TorresPuzzle; mode: GameMode }) {
  const start = useTorres((s) => s.start);
  const current = useTorres((s) => s.puzzle);
  const status = useTorres((s) => s.status);
  const values = useTorres((s) => s.values);
  const notes = useTorres((s) => s.notes);
  const selected = useTorres((s) => s.selected);
  const wrong = useTorres((s) => s.wrong);
  const select = useTorres((s) => s.select);
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    start(puzzle);
    recorded.current = false;
  }, [puzzle, start]);

  // Teclado físico: flechas, alturas, Shift+altura o N para notas, Borrar y Ctrl+Z.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey) return;
      if (e.target instanceof Element && e.target.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;
      const s = useTorres.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        s.undo();
        return;
      }
      if (e.metaKey || e.ctrlKey) return;
      const arrow = ARROWS[e.key];
      const digit = /^Digit([1-9])$/.exec(e.code)?.[1] ?? (/^[1-9]$/.test(e.key) ? e.key : null);
      if (arrow) {
        e.preventDefault();
        s.move(arrow[0], arrow[1]);
        // El foco acompaña a la selección si ya estaba en el tablero.
        if (gridRef.current?.contains(document.activeElement)) {
          requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${useTorres.getState().selected}"]`)?.focus());
        }
      } else if (digit) {
        e.preventDefault();
        s.input(Number(digit), e.shiftKey ? true : undefined);
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        s.erase();
      } else if (e.key.toLowerCase() === "n") {
        s.toggleNotesMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = useTorres.getState();
    const result = {
      won: status === "won",
      attempts: attemptsOf(status, s.mistakes),
      timeMs: (s.finishedAt ?? Date.now()) - s.startedAt,
      at: Date.now(),
    };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    else if (!mode.practice) p.recordDaily(GAME_ID, mode.date, result);
    const t = setTimeout(() => setResultOpen(true), status === "won" ? 600 : 300);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "daily" ? `Torres del día #${mode.number}` : `Nivel ${mode.level}`;
  const subtitle = mode.kind === "daily" ? "Mismo tablero para todos" : `Mundo ${mode.world}`;
  const ready = current === puzzle && values.length === puzzle.size * puzzle.size;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <Link href="/torres" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> {subtitle}
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-4 pb-1 text-sm font-semibold">
          <Lives />
          <Timer />
        </div>
      </div>

      <section aria-label="Ciudad" className="mb-2">
        <Board
          size={puzzle.size}
          clues={puzzle.clues}
          givens={puzzle.givens}
          values={ready ? values : puzzle.givens}
          notes={ready ? notes : undefined}
          selected={ready && status === "playing" ? selected : null}
          wrong={ready ? wrong : []}
          onSelect={select}
          readOnly={status !== "playing"}
          gridRef={gridRef}
        />
      </section>

      <CheckMessage />

      <section aria-label="Controles" className="mt-1 space-y-2">
        {status === "playing" ? (
          <>
            <NumberPad />
            <Toolbar />
          </>
        ) : (
          <div className="flex justify-center">
            <button className="text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setResultOpen(true)}>
              Ver resultado
            </button>
          </div>
        )}
      </section>

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
