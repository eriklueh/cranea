"use client";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeLetter, type PalabraPuzzle } from "@cranea/core/palabra";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/stores/progress";
import { GAME_ID, levelKey } from "../data";
import { useDictionary } from "../dictionary";
import { MAX_ATTEMPTS, usePalabra } from "../store";
import { InputSlots, Keyboard } from "./keyboard";
import { Lives } from "./lives";
import { ResultDialog, type GameMode } from "./result-dialog";
import { Timer } from "./timer";
import { WordRow } from "./word-row";

export function PalabraGame({ puzzle, mode }: { puzzle: PalabraPuzzle; mode: GameMode }) {
  const start = usePalabra((s) => s.start);
  const current = usePalabra((s) => s.puzzle);
  const status = usePalabra((s) => s.status);
  const misses = usePalabra((s) => s.misses);
  const { dict, failed, retry } = useDictionary();
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    start(puzzle);
    recorded.current = false;
  }, [puzzle, start]);

  const allowed = dict?.allowed ?? null;
  const submit = useCallback(() => usePalabra.getState().submit(allowed), [allowed]);

  // Teclado físico: letras (las tildes se ignoran, la Ñ cuenta), Borrar y Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;
      const s = usePalabra.getState();
      if (e.key === "Backspace") {
        e.preventDefault();
        s.backspace();
      } else if (e.key === "Enter") {
        // Enter sobre un botón conserva su activación nativa (por ejemplo, una tecla en pantalla).
        if (e.target instanceof Element && e.target.closest("button, a")) return;
        e.preventDefault();
        submit();
      } else {
        const letter = normalizeLetter(e.key);
        if (letter) s.press(letter);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit]);

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = usePalabra.getState();
    const result = {
      won: status === "won",
      attempts: status === "won" ? s.misses.length + 1 : MAX_ATTEMPTS,
      timeMs: (s.finishedAt ?? Date.now()) - s.startedAt,
      at: Date.now(),
    };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    else p.recordDaily(GAME_ID, mode.date, result);
    const t = setTimeout(() => setResultOpen(true), status === "won" ? 450 : 250);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "daily" ? `Palabra del día #${mode.number}` : `Nivel ${mode.level}`;
  const subtitle = mode.kind === "daily" ? "Misma palabra para todos" : `Mundo ${mode.world}`;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Link href="/palabra" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> {subtitle}
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-4 pb-1 text-sm font-semibold">
          <Lives />
          <Timer />
        </div>
      </div>

      <section aria-label="Pistas" className="mb-5">
        <ol className="space-y-2.5">
          {puzzle.clues.map((c, i) => (
            <WordRow key={i} clue={c} />
          ))}
          {misses.map((c, i) => (
            <WordRow key={`m${i}`} clue={c} miss />
          ))}
        </ol>
      </section>

      <section aria-label="Tu palabra" className="space-y-3">
        <InputSlots />
        {status !== "playing" && (
          <div className="flex justify-center">
            <button className="text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setResultOpen(true)}>
              Ver resultado
            </button>
          </div>
        )}
        {failed && (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground" role="alert">
            No se pudo cargar la lista de palabras.
            <Button size="sm" variant="outline" onClick={retry}>Reintentar</Button>
          </div>
        )}
        <Keyboard ready={Boolean(dict)} onSubmit={submit} />
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
