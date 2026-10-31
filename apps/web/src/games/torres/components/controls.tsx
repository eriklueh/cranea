"use client";
import { CheckIcon, DeleteIcon, PencilIcon, RotateCcwIcon, Undo2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { MAX_ATTEMPTS, useTorres } from "../store";

export function NumberPad() {
  const puzzle = useTorres((s) => s.puzzle);
  const status = useTorres((s) => s.status);
  const notesMode = useTorres((s) => s.notesMode);
  const input = useTorres((s) => s.input);
  const erase = useTorres((s) => s.erase);
  if (!puzzle) return null;
  const playing = status === "playing";
  return (
    <div className="grid gap-1.5" data-tutorial="pad" style={{ gridTemplateColumns: `repeat(${puzzle.size + 1}, minmax(0, 1fr))` }}>
      {Array.from({ length: puzzle.size }, (_, k) => k + 1).map((v) => (
        <button
          key={v}
          type="button"
          disabled={!playing}
          onClick={() => input(v)}
          aria-label={notesMode ? `Nota ${v}` : `Altura ${v}`}
          className={cn(
            "h-12 rounded-md border-2 border-ink bg-tile font-display text-xl font-bold tabular-nums shadow-[0_2px_0_0_var(--shadow-ink)] transition-transform duration-100 outline-none active:translate-y-px active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-35",
            notesMode && "border-dashed text-base font-semibold text-pencil",
          )}
        >
          {v}
        </button>
      ))}
      <button
        type="button"
        disabled={!playing}
        onClick={erase}
        aria-label="Borrar casilla"
        className="grid h-12 place-items-center rounded-md border-2 border-ink bg-tile shadow-[0_2px_0_0_var(--shadow-ink)] transition-transform duration-100 outline-none active:translate-y-px active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-35"
      >
        <DeleteIcon className="size-5" />
      </button>
    </div>
  );
}

export function Toolbar() {
  const status = useTorres((s) => s.status);
  const notesMode = useTorres((s) => s.notesMode);
  const canUndo = useTorres((s) => s.history.length > 0);
  const hasInput = useTorres((s) => s.puzzle !== null && s.values.some((v, i) => v && !s.puzzle!.givens[i]));
  const { toggleNotesMode, undo, reset, runCheck } = useTorres.getState();
  const playing = status === "playing";
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <Button data-tutorial="notes" variant={notesMode ? "default" : "outline"} size="lg" onClick={toggleNotesMode} disabled={!playing} aria-pressed={notesMode} className="px-1.5 text-sm">
        <PencilIcon className="max-[400px]:hidden" /> Notas
      </Button>
      <Button variant="outline" size="lg" onClick={undo} disabled={!playing || !canUndo} className="px-1.5 text-sm">
        <Undo2Icon className="max-[400px]:hidden" /> Deshacer
      </Button>
      <Button variant="outline" size="lg" onClick={reset} disabled={!playing || !canUndo} className="px-1.5 text-sm">
        <RotateCcwIcon className="max-[400px]:hidden" /> Reiniciar
      </Button>
      <Button size="lg" onClick={runCheck} disabled={!playing || !hasInput} className="px-1.5 text-sm">
        <CheckIcon className="max-[400px]:hidden" /> Comprobar
      </Button>
    </div>
  );
}

/** Mensaje breve después de comprobar. */
export function CheckMessage() {
  const check = useTorres((s) => s.check);
  const status = useTorres((s) => s.status);
  const mistakes = useTorres((s) => s.mistakes);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!check) return setVisible(false);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [check]);
  const left = MAX_ATTEMPTS - mistakes;
  const text =
    check?.kind === "ok"
      ? "Todo bien hasta acá."
      : status === "lost"
        ? "Se acabaron los intentos."
        : `Hay casillas para revisar. ${left === 1 ? "Te queda un intento." : `Te quedan ${left} intentos.`}`;
  return (
    <p aria-live="polite" className={cn("min-h-6 text-center text-sm font-semibold transition-opacity", check?.kind === "ok" ? "text-ok" : "text-margin", !visible && "opacity-0")}>
      {check && visible ? text : ""}
    </p>
  );
}

export function Lives() {
  const used = useTorres((s) => s.mistakes);
  const left = MAX_ATTEMPTS - used;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Te quedan ${left} de ${MAX_ATTEMPTS} intentos`}>
      {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
        <span key={i} className={cn("h-4 w-1.5 rounded-full transition-[background-color,scale] duration-300 ease-out", i < left ? "bg-ink" : "scale-y-60 bg-margin/40")} />
      ))}
    </span>
  );
}

export function Timer() {
  const startedAt = useTorres((s) => s.startedAt);
  const finishedAt = useTorres((s) => s.finishedAt);
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
